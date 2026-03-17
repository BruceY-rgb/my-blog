document.addEventListener('DOMContentLoaded', function() {
  // 添加打字机效果
  const commands = document.querySelectorAll('.term-command');
  commands.forEach((cmd, index) => {
    const text = cmd.textContent;
    cmd.textContent = '';
    let i = 0;

    setTimeout(() => {
      const typeInterval = setInterval(() => {
        if (i < text.length) {
          cmd.textContent += text.charAt(i);
          i++;
        } else {
          clearInterval(typeInterval);
        }
      }, 30 + Math.random() * 30);
    }, index * 200);
  });
});
