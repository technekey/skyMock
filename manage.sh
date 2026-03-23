#!/bin/bash

# Default Ports
FE_PORT=3021
BE_PORT=8000
PID_FILE_FE=".fe.pid"
PID_FILE_BE=".be.pid"

show_help() {
    echo "Usage: ./manage.sh [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  --start            Start both frontend and backend"
    echo "  --stop-server      Stop both frontend and backend"
    echo "  --build            Build the frontend for production"
    echo "  --help             Show this help message"
    echo ""
    echo "Options:"
    echo "  --front-end-port <port>  Set frontend port (default: 3021)"
    echo "  --backend-port <port>   Set backend port (default: 8000)"
}

stop_servers() {
    echo "Stopping servers..."
    if [ -f $PID_FILE_FE ]; then
        kill $(cat $PID_FILE_FE) 2>/dev/null
        rm $PID_FILE_FE
    fi
    if [ -f $PID_FILE_BE ]; then
        kill $(cat $PID_FILE_BE) 2>/dev/null
        rm $PID_FILE_BE
    fi
    # Cleanup any stray uvicorn/vite on these ports
    fuser -k ${FE_PORT}/tcp 2>/dev/null
    fuser -k ${BE_PORT}/tcp 2>/dev/null
    echo "Servers stopped."
}

build_ui() {
    echo "Building Frontend..."
    cd frontend && npm run build
    cd ..
}

start_servers() {
    # Update API_PORT in App.tsx dynamically for this session
    sed -i "s/const API_PORT = .*/const API_PORT = $BE_PORT;/" frontend/src/App.tsx

    echo "Starting Backend on port $BE_PORT..."
    source venv/bin/activate
    # Use 0.0.0.0 for LAN visibility
    PYTHONPATH=. uvicorn backend.app.main:app --host 0.0.0.0 --port $BE_PORT > backend.log 2>&1 &
    echo $! > $PID_FILE_BE

    echo "Starting Frontend on port $FE_PORT..."
    cd frontend
    # Pass backend port to frontend via Env var if needed, or rely on discovery
    npm run dev -- --host 0.0.0.0 --port $FE_PORT > ../frontend.log 2>&1 &
    echo $! > ../$PID_FILE_FE
    cd ..

    echo "Services are starting up..."
    echo "Frontend: http://$(hostname -I | awk '{print $1}'):$FE_PORT"
    echo "Backend:  http://$(hostname -I | awk '{print $1}'):$BE_PORT"
}

# Parse Arguments
COMMAND=""
while [[ $# -gt 0 ]]; do
    case $1 in
        --start) COMMAND="START"; shift ;;
        --stop-server) COMMAND="STOP"; shift ;;
        --build) COMMAND="BUILD"; shift ;;
        --help) show_help; exit 0 ;;
        --front-end-port) FE_PORT="$2"; shift 2 ;;
        --backend-port) BE_PORT="$2"; shift 2 ;;
        *) echo "Unknown option: $1"; show_help; exit 1 ;;
    esac
done

case $COMMAND in
    START)
        stop_servers
        start_servers
        ;;
    STOP)
        stop_servers
        ;;
    BUILD)
        build_ui
        ;;
    *)
        show_help
        ;;
esac
