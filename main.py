import requests
import json
import ai
import time
controller = ai.OllamaController()
if controller.start_server():
    print("当前状态:", "运行中" if controller.check_health() else "异常")
    print("\n最近日志:")
    print("\n".join(controller.get_logs()))
url = 'http://localhost:11434/api/generate'
data = {
    'model': 'deepseek-r1:1.5b',
    'prompt': '介绍一下你自己',
    'stream': True
}
response = requests.post(url, json=data, stream=True)
for line in response.iter_lines():
    if line:
        try:
            data = json.loads(line)
            text = data.get('response', '')
            print(text, end='', flush=True)
        except json.JSONDecodeError:
            print(f"无法解析的 JSON 数据: {line.decode('utf-8')}")
time.sleep(5)
print("\n测试完毕,准备关闭服务")
#controller.stop_server()
#print("停止后状态:", "运行中" if controller.check_health() else "已停止")