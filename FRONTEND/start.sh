#!/bin/bash
PORT=${PORT:-5173}
serve -s dist -l tcp://0.0.0.0:$PORT

