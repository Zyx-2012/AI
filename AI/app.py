from flask import Flask, request, render_template
from transformers import pipeline
import torch

app = Flask(__name__)

# 初始化 GPT-2 模型
generator = pipeline(
    'text-generation',
    model='./models/gpt2',  # 本地模型路径
    device=0 if torch.cuda.is_available() else -1  # 自动检测 GPU
)

def generate_response(prompt):
    try:
        # 生成回复
        response = generator(
            prompt,
            max_length=100,  # 控制生成长度
            num_return_sequences=1,  # 只生成一个回复
            temperature=0.7,  # 控制随机性
            repetition_penalty=1.2  # 避免重复
        )
        return response[0]['generated_text'].replace(prompt, "").strip()
    except Exception as e:
        return f"生成回复时出错：{str(e)}"

@app.route("/")
def home():
    return render_template("chat.html")

@app.route("/chat", methods=["POST"])
def chat():
    user_input = request.form["message"]
    return {"response": generate_response(user_input)}

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000)