let chatHistory = "";
let isWaitingForAI = false;

// 禁用发送按钮的样式
const disableSendButton = () => {
    const sendBtn = document.querySelector('button[onclick="sendMessage()"]');
    sendBtn.disabled = true;
    sendBtn.style.background = 'linear-gradient(135deg, #999, #666)';
    sendBtn.style.cursor = 'not-allowed';
};

// 启用发送按钮的样式
const enableSendButton = () => {
    const sendBtn = document.querySelector('button[onclick="sendMessage()"]');
    sendBtn.disabled = false;
    sendBtn.style.background = 'linear-gradient(135deg, #ff0080, #ff8c00)';
    sendBtn.style.cursor = 'pointer';
};

// 处理回车键
document.getElementById('user-input').addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        if (!isWaitingForAI) {
            e.preventDefault(); // 阻止默认行为（提交表单）
            sendMessage(); // 发送消息
        } else {
            // 在AI回复前，回车键变为换行
            e.preventDefault();
            const input = document.getElementById('user-input');
            const start = input.selectionStart;
            const end = input.selectionEnd;
            input.value = input.value.substring(0, start) + '\n' + input.value.substring(end);
            input.selectionStart = input.selectionEnd = start + 1;
        }
    }
});

const body = document.body;
let hue = 0;
setInterval(() => {
    hue = (hue + 1) % 360;
    body.style.backgroundColor = `hsl(${hue}, 50%, 10%)`;
}, 50);

// 自定义代码块渲染
function renderCodeBlock(code, lang) {
    return `
            <div class="code-container">
                <button class="copy-btn" data-clipboard-text="${encodeURIComponent(code)}">复制</button>
                <pre class="language-${lang || ''}"><code class="language-${lang || ''}">${code}</code></pre>
            </div>
        `;
}

// 使用 marked 渲染 Markdown，同时手动处理代码块
// 使用 marked 渲染 Markdown，同时手动处理代码块和内联代码
function renderMarkdown(text) {
    // 使用 marked 的 lexer 解析 Markdown
    const tokens = marked.lexer(text);

    let html = '';
    tokens.forEach(token => {
        if (token.type === 'code') {
            // 手动处理代码块
            html += renderCodeBlock(token.text, token.lang);
        } else if (token.type === 'paragraph') {
            // 处理段落中的内联代码
            let paragraphText = token.text;
            // 使用正则表达式匹配内联代码
            paragraphText = paragraphText.replace(/`([^`]+)`/g, '<code>$1</code>');
            html += `<p>${paragraphText}</p>`;
        } else {
            // 使用 marked 的 parser 处理其他 Markdown 内容
            html += marked.parser([token]);
        }
    });

    return html;
}

async function sendMessage() {
    const input = document.getElementById('user-input');
    const message = input.value.trim();
    if (!message || isWaitingForAI) return;

    // 清空输入框（立即反馈）
    input.value = '';

    const chatBox = document.getElementById('chat-box');
    chatBox.innerHTML += `<div class="user-msg">👤 ${message}</div>`;
    chatBox.scrollTop = chatBox.scrollHeight;

    // 显示加载动画
    const loadingMsg = document.createElement('div');
    loadingMsg.className = 'ai-msg';
    loadingMsg.innerHTML = '🤖 <span class="loading">思考中...</span>';
    chatBox.appendChild(loadingMsg);
    chatBox.scrollTop = chatBox.scrollHeight;

    // 锁定状态
    isWaitingForAI = true;
    disableSendButton(); // 禁用发送按钮

    try {
        // 调用后端接口
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
        let responseText = data.response;

        // 处理返回的字符串，移除 </think></think> 及其内容
        responseText = responseText.replace(/<think>.*?<\/think>/gs, '');

        // 更新聊天历史
        chatHistory += `\nUser: ${message}\nAI: ${responseText}`;

        // 移除加载动画并显示AI回复
        loadingMsg.remove();
        chatBox.innerHTML += `<div class="ai-msg">🤖 ${renderMarkdown(responseText)}</div>`;
        chatBox.scrollTop = chatBox.scrollHeight;

        // 初始化复制按钮
        const clipboard = new ClipboardJS('.copy-btn', {
            text: function (trigger) {
                return decodeURIComponent(trigger.getAttribute('data-clipboard-text'));
            }
        });

        // 复制成功后的提示
        clipboard.on('success', function (e) {
            e.trigger.textContent = '已复制';
            setTimeout(() => {
                e.trigger.textContent = '复制';
            }, 2000);
        });

        // 复制失败后的提示
        clipboard.on('error', function (e) {
            e.trigger.textContent = '复制失败';
            setTimeout(() => {
                e.trigger.textContent = '复制';
            }, 2000);
        });

        // 应用语法高亮
        Prism.highlightAll();
    } catch (error) {
        console.error('Error:', error);
        loadingMsg.innerHTML = '🤖 <span class="error">出错了，请稍后重试。</span>';
    } finally {
        // 解除状态锁定
        isWaitingForAI = false;
        enableSendButton(); // 启用发送按钮
    }
}

function clearHistory() {
    const chatBox = document.getElementById('chat-box');
    chatBox.innerHTML = '';
    chatHistory = "";
}

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
