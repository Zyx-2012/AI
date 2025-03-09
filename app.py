from flask import Flask, request, render_template, jsonify
import requests

app = Flask(__name__)

# 生成回复的函数
def generate_response(prompt):
    try:
        payload = {
            "model": "deepseek-r1:1.5b",  # 确保模型名称正确
            "prompt": prompt,
            "stream": False  # 不启用流式，后端一次性返回完整的回复
        }

        # 发送请求
        response = requests.post("http://localhost:11434/api/generate", json=payload)

        # 检查是否返回200
        response.raise_for_status()
        print(response.json().get("response", "No response found."))
        # 返回完整的生成文本
        return response.json().get("response", "No response found.")
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {str(e)}")
        return f"生成回复时出错：{str(e)}"

# 根路由，显示聊天页面
@app.route("/")
def home():
    return render_template("chat.html")

# 处理聊天请求的路由
@app.route("/chat", methods=["POST"])
def chat():
    user_input = request.form["message"]
    # 调用生成响应的函数
    response = generate_response(user_input)
    # 返回生成的响应
    return jsonify({"response": response})

# 运行Flask应用
if __name__ == "__main__":
    app.run(host='0.0.0.0', port=9090)
def run():
    app.run(host='0.0.0.0', port=9090)