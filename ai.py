import subprocess
import os
import time
import requests
import threading
from queue import Queue, Empty
class OllamaController:
    def __init__(self):
        self.server_path = "./ollama/ollama.exe"
        self.models_dir = os.path.abspath("models")
        self.base_url = "http://127.0.0.1:11434"
        self.process = None
        self.lock = threading.Lock()
        self.log_queue = Queue()
        if not os.path.exists(self.server_path):
            raise FileNotFoundError(f"Ollama executable not found at {self.server_path}")
    def start_server(self, timeout=10):
        with self.lock:
            if self.is_running():
                print("服务已在运行中")
                return False

            env = os.environ.copy()
            env["OLLAMA_MODELS"] = self.models_dir
            
            try:
                self.process = subprocess.Popen(
                    [self.server_path, "serve"],
                    env=env,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    text=True,
                    bufsize=1,
                    universal_newlines=True
                )
            except Exception as e:
                print(f"启动失败: {str(e)}")
                return False
            threading.Thread(
                target=self._capture_output,
                daemon=True
            ).start()
            start_time = time.time()
            while time.time() - start_time < timeout:
                if self.check_health():
                    print("服务启动成功")
                    return True
                time.sleep(1)
            print("服务启动超时")
            return False

    def _capture_output(self):
        while True:
            line = self.process.stdout.readline()
            if not line and self.process.poll() is not None:
                break
            self.log_queue.put(line.strip())

    def stop_server(self, force_kill=False):
        with self.lock:
            if not self.is_running():
                print("服务未运行")
                return False

            try:
                self.process.terminate()
                try:
                    self.process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    if force_kill:
                        self.process.kill()
                        self.process.wait()
                return True
            except Exception as e:
                print(f"停止失败: {str(e)}")
                return False

    def is_running(self):
        return self.process and self.process.poll() is None

    def check_health(self):
        try:
            resp = requests.get(f"{self.base_url}/", timeout=2)
            return resp.status_code == 200
        except:
            return False

    def get_logs(self, max_lines=100):
        logs = []
        while not self.log_queue.empty() and len(logs) < max_lines:
            logs.append(self.log_queue.get())
        return logs[::-1] 
if __name__ == "__main__":
    controller = OllamaController()
    if controller.start_server():
        print("当前状态:", "运行中" if controller.check_health() else "异常")
        print("\n最近日志:")
        print("\n".join(controller.get_logs()))