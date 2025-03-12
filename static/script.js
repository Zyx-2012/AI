let chatHistory = "";

// 动态背景颜色变化
const body = document.body;
let hue = 0;
setInterval(() => {
    hue = (hue + 1) % 360;
    body.style.backgroundColor = `hsl(${hue}, 50%, 10%)`;
}, 50);

// 渲染 Markdown 内容
function renderMarkdown(text) {
    return text
        .replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
            return `<pre><button class="copy-btn" data-clipboard-text="${encodeURIComponent(code)}">复制</button><code class="language-${lang || ''}">${code}</code></pre>`;
        })
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // 加粗
        .replace(/\*(.*?)\*/g, '<em>$1</em>');  // 斜体
}

// 发送消息
async function sendMessage() {
    const input = document.getElementById('user-input');
    const message = input.value.trim();
    if (!message) return;

    const chatBox = document.getElementById('chat-box');
    chatBox.innerHTML += `<div class="user-msg">👤 ${message}</div>`;
    chatBox.scrollTop = chatBox.scrollHeight;

    // 显示加载动画
    const loadingMsg = document.createElement('div');
    loadingMsg.className = 'ai-msg';
    loadingMsg.innerHTML = '🤖 <span class="loading">思考中...</span>';
    chatBox.appendChild(loadingMsg);
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const response = await fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                message: message,
                history: chatHistory
            })
        });

        const data = await response.json();
        chatHistory += `\nUser: ${message}\nAI: ${data.response}`;

        // 移除加载动画，显示 AI 回复
        loadingMsg.remove();
        chatBox.innerHTML += `<div class="ai-msg">🤖 ${renderMarkdown(data.response)}</div>`;
        chatBox.scrollTop = chatBox.scrollHeight;

        // 初始化复制按钮
        new ClipboardJS('.copy-btn', {
            text: function(trigger) {
                return decodeURIComponent(trigger.getAttribute('data-clipboard-text'));
            }
        });
    } catch (error) {
        console.error('Error:', error);
        loadingMsg.innerHTML = '🤖 <span class="error">出错了，请稍后重试。</span>';
    }

    input.value = '';
}

// 加载动画样式
const style = document.createElement('style');
style.innerHTML = `
    .loading::after {
        content: '';
        display: inline-block;
        width: 1em;
        height: 1em;
        border: 2px solid #fff;
        border-radius: 50%;
        border-top-color: transparent;
        animation: spin 1s linear infinite;
        margin-left: 0.5em;
    }
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    .error {
        color: #ff4444;
    }
`;
document.head.appendChild(style);