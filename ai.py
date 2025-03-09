from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import os
import time
import requests
import threading

app = Flask(__name__)
CORS(app)  # 允许跨域请求

# 配置项
OLLAMA_SERVER_PATH = "./ollama/ollama.exe"
MODELS_DIR = os.path.abspath("models")
OLLAMA_URL = "http://localhost:11434"


# 启动Ollama服务器
def start_ollama_server():
    env = os.environ.copy()
    env["OLLAMA_MODELS"] = MODELS_DIR
    server_process = subprocess.Popen(
        [OLLAMA_SERVER_PATH, "serve"],
        env=env,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )
    time.sleep(5)  # 等待服务器启动
    return server_process


# 全局变量保存服务器进程
server_process = start_ollama_server()


@app.route('/api/models', methods=['GET'])
def get_models():
    """获取可用模型列表"""
    try:
        response = requests.get(f"{OLLAMA_URL}/api/tags")
        return jsonify(response.json())
    except requests.exceptions.ConnectionError:
        return jsonify({"error": "无法连接到Ollama服务器"}), 500


@app.route('/api/generate', methods=['POST'])
def generate_response():
    """生成对话响应"""
    data = request.json
    required_fields = ['model', 'prompt']

    # 验证必要字段
    if not all(field in data for field in required_fields):
        return jsonify({"error": "缺少必要字段: model 或 prompt"}), 400

    payload = {
        "model": data['model'],
        "prompt": data['prompt'],
        "stream": data.get('stream', False),
        "options": data.get('options', {})
    }

    try:
        response = requests.post(f"{OLLAMA_URL}/api/generate", json=payload)
        return jsonify(response.json())
    except requests.exceptions.ConnectionError:
        return jsonify({"error": "无法连接到Ollama服务"}), 500


@app.route('/api/health', methods=['GET'])
def health_check():
    """健康检查端点"""
    try:
        requests.get(f"{OLLAMA_URL}/api/tags", timeout=2)
        return jsonify({"status": "healthy"})
    except:
        return jsonify({"status": "unhealthy"}), 500


def shutdown_server():
    """关闭服务器时清理Ollama进程"""
    server_process.terminate()


@app.teardown_appcontext
def teardown(exception=None):
    shutdown_server()


if __name__ == '__main__':
    # 等待服务器启动
    time.sleep(2)

    # 在独立线程运行Flask应用
    threading.Thread(target=app.run, kwargs={'port': 5001}).start()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        shutdown_server()
def run():
    threading.Thread(target=app.run, kwargs={'port': 5001}).start()