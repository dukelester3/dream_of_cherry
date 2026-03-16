/**
 * 高级悬浮社交工具 - 前端 JavaScript
 */
(function () {
  // 获取配置
  var config = window.floatingWidgetConfig || {};
  
  // 国际化文本
  var i18n = config.i18n || {
    useLineToScan: '使用 LINE 扫描二维码',
    useWechatToScan: '使用微信扫描二维码',
    useGleezyToScan: '使用Gleezy扫描二维码',
    wechatId: '微信 ID',
    gleezyId: 'Gleezy ID',
    lineId: 'LINE ID',
    copyAndJumpToWechat: '复制ID并跳转微信',
    copyAndJumpToGleezy: '复制ID并跳转Gleezy',
    copyAndJumpToLine: '复制ID并跳转LINE',
    idNotFound: 'ID 未找到，无法复制',
    cannotCopy: '无法复制ID，请手动复制',
    addFriendManually: '请跳转后，手动添加好友，谢谢',
    backToTop: '返回顶部'
  };
  
  // 提取插件URL路径，用于构建图标URL
  var pluginUrl = '';
  if (document.currentScript) {
    var scriptUrl = document.currentScript.src;
    pluginUrl = scriptUrl.substring(0, scriptUrl.lastIndexOf('/js/')) + '/';
  } else {
    // 回退方案，尝试从其他元素推断
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      if (scripts[i].src && scripts[i].src.includes('floating-social-widget.js')) {
        var scriptUrl = scripts[i].src;
        pluginUrl = scriptUrl.substring(0, scriptUrl.lastIndexOf('/js/')) + '/';
        break;
      }
    }
  }
  
  // 获取按钮数据
  var buttons = config.buttons || [];
  
  // 兼容旧版本的直接变量
  var telegramUsername = config.telegramUsername || "";
  var lineUrl = config.lineUrl || "";
  var wechatId = config.wechatId || "";
  var wechatQRCodeUrl = config.wechatQRCodeUrl || "";
  var whatsappNumber = config.whatsappNumber || "";
  var facebookUrl = config.facebookUrl || "";
  var instagramUrl = config.instagramUrl || "";
  var twitterUrl = config.twitterUrl || "";
  var youtubeUrl = config.youtubeUrl || "";
  var customLinks = config.customLinks || [];
  
  // 配置设置
  var position = config.position || "right-bottom";
  var displayStyle = config.displayStyle || "column";
  var animation = config.animation || "fade";
  var buttonShape = config.buttonShape || "circle";
  var isDisplayBackToTop = config.isDisplayBackToTop || "yes";
  
  // 图标资源
  var iconUrls = {
    telegram: config.telegramImageUrl,
    line: config.lineImageUrl,
    wechat: config.wechatImageUrl,
    whatsapp: config.whatsappImageUrl,
    facebook: config.facebookImageUrl,
    instagram: config.instagramImageUrl,
    twitter: config.twitterImageUrl,
    youtube: config.youtubeImageUrl,
    gleezy: config.gleezyImageUrl,
    backToTop: config.backToTopUrl
  };
  
  // 为了向后兼容，把图标URL定义为单独的变量
  var gleezyImageUrl = config.gleezyImageUrl;
  var telegramImageUrl = iconUrls.telegram;
  var lineImageUrl = iconUrls.line;
  var wechatImageUrl = iconUrls.wechat;
  var whatsappImageUrl = iconUrls.whatsapp;
  var facebookImageUrl = iconUrls.facebook;
  var instagramImageUrl = iconUrls.instagram;
  var twitterImageUrl = iconUrls.twitter;
  var youtubeImageUrl = iconUrls.youtube;
  var backToTopUrl = iconUrls.backToTop;
  
  // 依赖库
  var qrcodeJs = config.qrcodeJs || "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";

  // 检测是否为移动设备
  function isMobileDevice() {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  }

  // 加载 QRCode.js
  function loadQRCode(callback) {
    if (window.QRCode) {
      callback();
      return;
    }
    
    var script = document.createElement("script");
    script.src = qrcodeJs;
    script.onload = callback;
    document.head.appendChild(script);
  }

  // 创建浮动按钮
  function createFloatingButtons() {
    // 创建容器
    var container = document.createElement("div");
    container.className = "fsw-floating-container";
    
    // 设置数据属性和样式
    container.setAttribute("data-position", position);
    
    if (displayStyle === "row") {
        container.classList.add("fsw-horizontal");
    }
    
    if (animation !== "none") {
      container.classList.add("fsw-animation-" + animation);
    }
    
    // 从buttons数组创建按钮
    if (buttons && buttons.length > 0) {
      buttons.forEach(function(buttonData) {
        var buttonType = buttonData.type;
        var buttonTitle = buttonData.title;
        var buttonIcon = buttonData.icon;
        
        var button;
        
        switch (buttonType) {
          case "gleezy":
            // 只要有二维码就显示按钮
            if (buttonData.qrcode) {
              button = createButton({
                type: buttonType,
                title: buttonTitle,
                icon: buttonIcon,
                action: function() {
                  showGleezyModal(
                    buttonData.id || '',
                    buttonData.qrcode
                  );
                }
              });
            }
            break;
            
          case "telegram":
            button = createButton({
              type: buttonType,
              title: buttonTitle,
              icon: buttonIcon,
              action: function() {
                if (isMobileDevice()) {
                  window.location.href = "tg://resolve?domain=" + encodeURIComponent(buttonData.id);
                } else {
                  window.open("https://t.me/" + encodeURIComponent(buttonData.id), "_blank");
                }
              }
            });
            break;
            
          case "line":
            // 只要有二维码就显示按钮
            if (buttonData.qrcode) {
              button = createButton({
                type: buttonType,
                title: buttonTitle,
                icon: buttonIcon,
                action: function() {
                  showLineModal(buttonData.id || '', buttonData.qrcode);
                }
              });
            }
            break;
            
          case "wechat":
            // 只要有二维码就显示按钮
            if (buttonData.qrcode) {
              button = createButton({
                type: buttonType,
                title: buttonTitle,
                icon: buttonIcon,
                action: function() {
                  showWechatModal(buttonData.id || '', buttonData.qrcode);
                }
              });
            }
            break;
            
          case "whatsapp":
            button = createButton({
              type: buttonType,
              title: buttonTitle,
              icon: buttonIcon,
              action: function() {
                var number = buttonData.number.replace(/[^\d+]/g, '');
                window.open("https://wa.me/" + number, "_blank");
              }
            });
            break;
            
          case "facebook":
          case "instagram":
          case "twitter":
          case "youtube":
            button = createButton({
              type: buttonType,
              title: buttonTitle,
              icon: buttonIcon,
              action: function() {
                window.open(buttonData.url, "_blank");
              }
            });
            break;
            
          case "custom":
            button = createButton({
              type: buttonType,
              title: buttonTitle,
              icon: buttonIcon,
              action: function() {
                if (buttonData.new_tab === "1") {
                  window.open(buttonData.url, "_blank");
                } else {
                  window.location.href = buttonData.url;
                }
              }
            });
            break;
        }
        
        if (button) {
          container.appendChild(button);
        }
      });
    } else {
      // 向后兼容：使用旧版本的方式创建按钮
      // 创建 Gleezy 按钮
      if (config.gleezyQRCodeUrl) {
        var gleezyButton = createButton({
          type: "gleezy",
          title: "Gleezy",
          action: function() {
            showGleezyModal(
              config.gleezyId || '',
              config.gleezyQRCodeUrl
            );
          }
        });
        container.appendChild(gleezyButton);
      }
      
      // 创建 Telegram 按钮
      if (telegramUsername) {
        var telegramButton = createButton({
          type: "telegram",
          title: "Telegram",
          action: function() {
            if (isMobileDevice()) {
              window.location.href = "tg://resolve?domain=" + encodeURIComponent(telegramUsername);
            } else {
              window.open("https://t.me/" + encodeURIComponent(telegramUsername), "_blank");
            }
          }
        });
        container.appendChild(telegramButton);
      }
  
      // 创建 LINE 按钮
      if (lineUrl) {
        var lineButton = createButton({
          type: "line",
          title: "LINE",
          action: function() {
            showLineModal(config.lineId || '', config.lineQRCodeUrl || lineUrl);
          }
        });
        container.appendChild(lineButton);
      }
  
      // 创建 Wechat 按钮
      if (wechatQRCodeUrl) {
        var wechatButton = createButton({
          type: "wechat",
          title: "微信",
          action: function() {
            showWechatModal(wechatId || '', wechatQRCodeUrl);
          }
        });
        container.appendChild(wechatButton);
      }
      
      // 创建 WhatsApp 按钮
      if (whatsappNumber) {
        var whatsappButton = createButton({
          type: "whatsapp",
          title: "WhatsApp",
          action: function() {
            // 移除所有非数字字符（保留+号）
            var number = whatsappNumber.replace(/[^\d+]/g, '');
            window.open("https://wa.me/" + number, "_blank");
          }
        });
        container.appendChild(whatsappButton);
      }
      
      // 创建 Facebook 按钮
      if (facebookUrl) {
        var facebookButton = createButton({
          type: "facebook",
          title: "Facebook",
          action: function() {
            window.open(facebookUrl, "_blank");
          }
        });
        container.appendChild(facebookButton);
      }
      
      // 创建 Instagram 按钮
      if (instagramUrl) {
        var instagramButton = createButton({
          type: "instagram",
          title: "Instagram",
          action: function() {
            window.open(instagramUrl, "_blank");
          }
        });
        container.appendChild(instagramButton);
      }
      
      // 创建 Twitter 按钮
      if (twitterUrl) {
        var twitterButton = createButton({
          type: "twitter",
          title: "Twitter",
          action: function() {
            window.open(twitterUrl, "_blank");
          }
        });
        container.appendChild(twitterButton);
      }
      
      // 创建 YouTube 按钮
      if (youtubeUrl) {
        var youtubeButton = createButton({
          type: "youtube",
          title: "YouTube",
          action: function() {
            window.open(youtubeUrl, "_blank");
          }
        });
        container.appendChild(youtubeButton);
      }
      
      // 创建自定义按钮
      if (customLinks && customLinks.length > 0) {
        customLinks.forEach(function(link) {
          if (link.title && link.url) {
            var customButton = createButton({
              type: "custom",
              title: link.title,
              icon: link.icon,
              action: function() {
                if (link.newTab === "1") {
                  window.open(link.url, "_blank");
                } else {
                  window.location.href = link.url;
                }
              }
            });
            container.appendChild(customButton);
          }
        });
      }
    }
    
    // 创建返回顶部按钮
    if (isDisplayBackToTop === "yes") {
      var backToTopButton = createButton({
        type: "back-to-top",
        title: i18n.backToTop,
        action: backToTop
      });
      container.appendChild(backToTopButton);
    }
    
    // 添加到文档
    document.body.appendChild(container);

    // 创建 QR 码模态框
    createQRCodeModal();
    
    // 创建微信模态框
    createWechatModal();
    
    // 创建LINE模态框
    createLineModal();
    
    // 创建Gleezy模态框
    createGleezyModal();
    
    // 执行自定义JavaScript
    if (config.customJS) {
      try {
        // eslint-disable-next-line no-new-func
        var customJsFunc = new Function(config.customJS);
        customJsFunc();
      } catch (e) {
        console.error('自定义JS执行错误: ', e);
      }
    }
  }
  
  // 创建按钮
  function createButton(options) {
    var button = document.createElement("button");
    button.className = "fsw-floating-button fsw-floating-button--" + options.type;
    button.title = options.title;
    
    // 添加形状类
    if (buttonShape !== "circle") {
      button.classList.add("fsw-shape-" + buttonShape);
    }
    
    // 检查是否是Font Awesome图标
    if (options.icon && options.icon.startsWith("fa-")) {
      // 使用FontAwesome图标
      var icon = document.createElement("i");
      
      // 完整的class路径
      if (options.icon.indexOf(' ') > -1) {
        // 如果已经包含完整类名，直接使用
        icon.className = options.icon;
      } else {
        // 否则添加默认前缀
        icon.className = "fas " + options.icon;
      }
      
      // 初始设置为不可见，等待Font Awesome加载完成
      icon.style.visibility = 'hidden';
      
      // 确保Font Awesome加载
      ensureFontAwesomeLoaded();
      
      // 如果Font Awesome已加载，设置为可见
      if (document.getElementById('fsw-fontawesome-css') || document.getElementById('fsw-fontawesome-backup')) {
        setTimeout(function() {
          icon.style.visibility = 'visible';
        }, 300); // 延迟设置可见性，确保CSS已被应用
      }
      
      // 监听字体加载完成事件
      document.addEventListener('fsw-fontawesome-loaded', function() {
        icon.style.visibility = 'visible';
      });
      
      button.appendChild(icon);
    } else {
      // 使用SVG/PNG图标
      var img = document.createElement("img");
      
      // 如果提供了自定义图标URL，优先使用
      if (options.icon && (options.icon.startsWith("http") || options.icon.startsWith("/"))) {
        // 如果是Gleezy并且是SVG，改为PNG
        if (options.type === "gleezy" && options.icon.includes('.svg')) {
          img.src = options.icon.replace('.svg', '.png');
        } else {
          img.src = options.icon;
        }
      } else {
        // 否则使用预定义图标
        switch (options.type) {
          case "gleezy":
            // 确保使用PNG格式的Gleezy图标
            img.src = gleezyImageUrl ? gleezyImageUrl.replace('.svg', '.png') : (pluginUrl + 'images/social/gleezy.png');
            break;
          case "telegram":
            img.src = telegramImageUrl;
            break;
          case "line":
            img.src = lineImageUrl;
            break;
          case "wechat":
            img.src = wechatImageUrl;
            break;
          case "whatsapp":
            img.src = whatsappImageUrl;
            break;
          case "facebook":
            img.src = facebookImageUrl;
            break;
          case "instagram":
            img.src = instagramImageUrl;
            break;
          case "twitter":
            img.src = twitterImageUrl;
            break;
          case "youtube":
            img.src = youtubeImageUrl;
            break;
          case "back-to-top":
            img.src = backToTopUrl;
            img.className = "fsw-back-to-top-icon";
            break;
        }
      }
      
      button.appendChild(img);
    }
    
    // 悬停提示
    if (options.title) {
      var tooltip = document.createElement("span");
      tooltip.className = "fsw-tooltip";
      tooltip.textContent = options.title;
      button.appendChild(tooltip);
    }
    
    // 添加点击事件
    if (typeof options.action === "function") {
      button.addEventListener("click", options.action);
    }
    
    return button;
  }
  
  // 创建 QR 码模态框
  function createQRCodeModal() {
    var modal = document.createElement("div");
    modal.id = "fsw-qrCodeModal";
    modal.className = "fsw-modal";
    
    var modalContent = document.createElement("div");
    modalContent.className = "fsw-modal-content";
    
    var closeButton = document.createElement("span");
    closeButton.className = "fsw-close-button";
    closeButton.innerHTML = "&times;";
    closeButton.onclick = function() {
      closeModal("fsw-qrCodeModal");
    };
    
    var title = document.createElement("h3");
    title.id = "fsw-qrcode-title";
    
    var qrCodeDiv = document.createElement("div");
    qrCodeDiv.id = "fsw-qrCode";
    
    modalContent.appendChild(closeButton);
    modalContent.appendChild(title);
    modalContent.appendChild(qrCodeDiv);
    modal.appendChild(modalContent);
    
    document.body.appendChild(modal);
  }
  
  // 创建微信模态框
  function createWechatModal() {
    var modal = document.createElement("div");
    modal.id = "fsw-wechatModal";
    modal.className = "fsw-modal";
    
    var modalContent = document.createElement("div");
    modalContent.className = "fsw-modal-content";
    
    var closeButton = document.createElement("span");
    closeButton.className = "fsw-close-button";
    closeButton.innerHTML = "&times;";
    closeButton.onclick = function() {
      closeModal("fsw-wechatModal");
    };
    
    var title = document.createElement("h3");
    title.innerText = i18n.useWechatToScan;
    
    var qrCodeDiv = document.createElement("div");
    qrCodeDiv.id = "fsw-wechatQrCode";
    
    var wechatInfo = document.createElement("h3");
    wechatInfo.innerHTML = i18n.wechatId + ': <span id="fsw-wechat-id-info"></span>';
    
    var wechatInstructions = document.createElement("p");
    wechatInstructions.innerText = i18n.addFriendManually;
    
    var copyButton = document.createElement("button");
    copyButton.className = "fsw-copy-and-open-wechat";
    copyButton.innerText = i18n.copyAndJumpToWechat;
    copyButton.onclick = copyAndOpenWechat;
    
    modalContent.appendChild(closeButton);
    modalContent.appendChild(title);
    modalContent.appendChild(qrCodeDiv);
    modalContent.appendChild(wechatInfo);
    modalContent.appendChild(wechatInstructions);
    modalContent.appendChild(copyButton);
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
  }
  
  // 显示 QR 码模态框
  function showQRCodeModal(title, url) {
    loadQRCode(function() {
      document.getElementById("fsw-qrcode-title").innerText = title;
      
      var qrCodeElement = document.getElementById("fsw-qrCode");
      qrCodeElement.innerHTML = "";
      
      new QRCode(qrCodeElement, {
        text: url,
        width: 200,
        height: 200,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
      });
      
      document.getElementById("fsw-qrCodeModal").style.display = "block";
    });
  }
  
  // 显示微信模态框
  function showWechatModal(id, qrcode) {
    loadQRCode(function() {
      var qrCodeElement = document.getElementById("fsw-wechatQrCode");
      qrCodeElement.innerHTML = "";
      
      // 如果提供了二维码URL，直接使用图片显示
      if (qrcode.startsWith("http")) {
        var img = document.createElement("img");
        img.src = qrcode;
        img.style.width = "200px";
        img.style.height = "200px";
        qrCodeElement.appendChild(img);
      } else {
        // 否则生成二维码
        new QRCode(qrCodeElement, {
          text: qrcode,
          width: 200,
          height: 200,
          colorDark: "#000000",
          colorLight: "#ffffff",
          correctLevel: QRCode.CorrectLevel.H
        });
      }
      
      // 处理ID相关元素
      var wechatInfo = document.getElementById("fsw-wechat-id-info");
      var wechatInstructions = document.getElementById("fsw-wechatModal").querySelector("p");
      var copyButton = document.querySelector(".fsw-copy-and-open-wechat");
      
      if (id && id.trim() !== '') {
        // 有ID时显示相关元素
        wechatInfo.innerText = id;
        wechatInfo.parentElement.style.display = "block";
        wechatInstructions.style.display = "block";
        copyButton.style.display = "inline-block";
      } else {
        // 无ID时隐藏相关元素
        wechatInfo.parentElement.style.display = "none";
        wechatInstructions.style.display = "none";
        copyButton.style.display = "none";
      }
      
      // 显示模态框
      document.getElementById("fsw-wechatModal").style.display = "block";
    });
  }
  
  // 复制微信ID并打开微信
  function copyAndOpenWechat() {
    var wechatIdElement = document.getElementById("fsw-wechat-id-info");
    var wechatId = wechatIdElement ? wechatIdElement.textContent.trim() : "";
    
    if (!wechatId) {
      console.error("WeChat ID not found.");
      alert(i18n.idNotFound);
      return;
    }
    
    // 使用 Clipboard API 复制文本
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(wechatId)
        .then(function() {
          console.log("WeChat ID copied to clipboard successfully!");
          
          // 尝试跳转到微信
          window.location.href = "weixin://";
          
          // 隐藏模态框
          closeModal("fsw-wechatModal");
        })
        .catch(function(err) {
          console.error("Failed to copy WeChat ID: ", err);
          alert(i18n.cannotCopy);
          
          // 尝试跳转到微信
          window.location.href = "weixin://";
          
          // 隐藏模态框
          closeModal("fsw-wechatModal");
        });
    } else {
      // 回退到旧方法
      var textarea = document.createElement("textarea");
      textarea.value = wechatId;
      textarea.style.position = "fixed";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      
      try {
        document.execCommand("copy");
        console.log("WeChat ID copied to clipboard successfully!");
      } catch (err) {
        console.error("Failed to copy WeChat ID: ", err);
        alert(i18n.cannotCopy);
      }
      
      document.body.removeChild(textarea);
      
      // 尝试跳转到微信
      window.location.href = "weixin://";
      
      // 隐藏模态框
      closeModal("fsw-wechatModal");
    }
  }
  
  // 创建Gleezy模态框
  function createGleezyModal() {
    var modal = document.createElement("div");
    modal.id = "fsw-gleezyModal";
    modal.className = "fsw-modal";
    
    var modalContent = document.createElement("div");
    modalContent.className = "fsw-modal-content";
    
    var closeButton = document.createElement("span");
    closeButton.className = "fsw-close-button";
    closeButton.innerHTML = "&times;";
    closeButton.onclick = function() {
      closeModal("fsw-gleezyModal");
    };
    
    var title = document.createElement("h3");
    title.innerText = i18n.useGleezyToScan;
    
    var qrCodeDiv = document.createElement("div");
    qrCodeDiv.id = "fsw-gleezyQrCode";
    
    var gleezyInfo = document.createElement("h3");
    gleezyInfo.innerHTML = i18n.gleezyId + ': <span id="fsw-gleezy-id-info"></span>';
    
    var gleezyInstructions = document.createElement("p");
    gleezyInstructions.innerText = i18n.addFriendManually;
    
    var copyButton = document.createElement("button");
    copyButton.className = "fsw-copy-and-open-wechat";
    copyButton.innerText = i18n.copyAndJumpToGleezy;
    copyButton.onclick = copyAndOpenGleezy;
    
    modalContent.appendChild(closeButton);
    modalContent.appendChild(title);
    modalContent.appendChild(qrCodeDiv);
    modalContent.appendChild(gleezyInfo);
    modalContent.appendChild(gleezyInstructions);
    modalContent.appendChild(copyButton);
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
  }
  
  // 显示Gleezy模态框
  function showGleezyModal(id, qrcode) {
    loadQRCode(function() {
      var qrCodeElement = document.getElementById("fsw-gleezyQrCode");
      qrCodeElement.innerHTML = "";
      
      // 如果提供了二维码URL，直接使用图片显示
      if (qrcode.startsWith("http")) {
        var img = document.createElement("img");
        img.src = qrcode;
        img.style.width = "200px";
        img.style.height = "200px";
        qrCodeElement.appendChild(img);
      } else {
        // 否则生成二维码
        new QRCode(qrCodeElement, {
          text: qrcode,
          width: 200,
          height: 200,
          colorDark: "#000000",
          colorLight: "#ffffff",
          correctLevel: QRCode.CorrectLevel.H
        });
      }
      
      // 处理ID相关元素
      var gleezyInfo = document.getElementById("fsw-gleezy-id-info");
      var gleezyInstructions = document.getElementById("fsw-gleezyModal").querySelector("p");
      var copyButton = document.querySelector("#fsw-gleezyModal .fsw-copy-and-open-wechat");
      
      if (id && id.trim() !== '') {
        // 有ID时显示相关元素
        gleezyInfo.innerText = id;
        gleezyInfo.parentElement.style.display = "block";
        gleezyInstructions.style.display = "block";
        copyButton.style.display = "inline-block";
      } else {
        // 无ID时隐藏相关元素
        gleezyInfo.parentElement.style.display = "none";
        gleezyInstructions.style.display = "none";
        copyButton.style.display = "none";
      }
      
      // 显示模态框
      document.getElementById("fsw-gleezyModal").style.display = "block";
    });
  }
  
  // 复制Gleezy ID并打开Gleezy
  function copyAndOpenGleezy() {
    var gleezyIdElement = document.getElementById("fsw-gleezy-id-info");
    var gleezyId = gleezyIdElement ? gleezyIdElement.textContent.trim() : "";
    
    if (!gleezyId) {
      console.error("Gleezy ID not found.");
      alert(i18n.idNotFound);
      return;
    }
    
    // 使用 Clipboard API 复制文本
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(gleezyId)
        .then(function() {
          console.log("Gleezy ID copied to clipboard successfully!");
          
          // 尝试跳转到Gleezy
          window.location.href = "gleezy://";
          
          // 隐藏模态框
          closeModal("fsw-gleezyModal");
        })
        .catch(function(err) {
          console.error("Failed to copy Gleezy ID: ", err);
          alert(i18n.cannotCopy);
          
          // 尝试跳转到Gleezy
          window.location.href = "gleezy://";
          
          // 隐藏模态框
          closeModal("fsw-gleezyModal");
        });
    } else {
      // 回退到旧方法
      var textarea = document.createElement("textarea");
      textarea.value = gleezyId;
      textarea.style.position = "fixed";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      
      try {
        document.execCommand("copy");
        console.log("Gleezy ID copied to clipboard successfully!");
      } catch (err) {
        console.error("Failed to copy Gleezy ID: ", err);
        alert(i18n.cannotCopy);
      }
      
      document.body.removeChild(textarea);
      
      // 尝试跳转到Gleezy
      window.location.href = "gleezy://";
      
      // 隐藏模态框
      closeModal("fsw-gleezyModal");
    }
  }
  
  // 创建LINE模态框
  function createLineModal() {
    var modal = document.createElement("div");
    modal.id = "fsw-lineModal";
    modal.className = "fsw-modal";
    
    var modalContent = document.createElement("div");
    modalContent.className = "fsw-modal-content";
    
    var closeButton = document.createElement("span");
    closeButton.className = "fsw-close-button";
    closeButton.innerHTML = "&times;";
    closeButton.onclick = function() {
      closeModal("fsw-lineModal");
    };
    
    var title = document.createElement("h3");
    title.innerText = i18n.useLineToScan;
    
    var qrCodeDiv = document.createElement("div");
    qrCodeDiv.id = "fsw-lineQrCode";
    
    var lineInfo = document.createElement("h3");
    lineInfo.innerHTML = i18n.lineId + ': <span id="fsw-line-id-info"></span>';
    
    var lineInstructions = document.createElement("p");
    lineInstructions.innerText = i18n.addFriendManually;
    
    var copyButton = document.createElement("button");
    copyButton.className = "fsw-copy-and-open-line";
    copyButton.innerText = i18n.copyAndJumpToLine;
    copyButton.onclick = copyAndOpenLine;
    
    modalContent.appendChild(closeButton);
    modalContent.appendChild(title);
    modalContent.appendChild(qrCodeDiv);
    modalContent.appendChild(lineInfo);
    modalContent.appendChild(lineInstructions);
    modalContent.appendChild(copyButton);
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
  }
  
  // 显示LINE模态框
  function showLineModal(id, qrcode) {
    loadQRCode(function() {
      var qrCodeElement = document.getElementById("fsw-lineQrCode");
      qrCodeElement.innerHTML = "";
      
      // 如果提供了二维码URL，直接使用图片显示
      if (qrcode.startsWith("http")) {
        var img = document.createElement("img");
        img.src = qrcode;
        img.style.width = "200px";
        img.style.height = "200px";
        qrCodeElement.appendChild(img);
      } else {
        // 否则生成二维码
        new QRCode(qrCodeElement, {
          text: qrcode,
          width: 200,
          height: 200,
          colorDark: "#000000",
          colorLight: "#ffffff",
          correctLevel: QRCode.CorrectLevel.H
        });
      }
      
      // 处理ID相关元素
      var lineInfo = document.getElementById("fsw-line-id-info");
      var lineInstructions = document.getElementById("fsw-lineModal").querySelector("p");
      var copyButton = document.querySelector(".fsw-copy-and-open-line");
      
      if (id && id.trim() !== '') {
        // 有ID时显示相关元素
        lineInfo.innerText = id;
        lineInfo.parentElement.style.display = "block";
        lineInstructions.style.display = "block";
        copyButton.style.display = "inline-block";
      } else {
        // 无ID时隐藏相关元素
        lineInfo.parentElement.style.display = "none";
        lineInstructions.style.display = "none";
        copyButton.style.display = "none";
      }
      
      // 显示模态框
      document.getElementById("fsw-lineModal").style.display = "block";
    });
  }
  
  // 复制LINE URL并打开LINE
  function copyAndOpenLine() {
    var lineIdElement = document.getElementById("fsw-line-id-info");
    var lineId = lineIdElement ? lineIdElement.textContent.trim() : "";
    
    if (!lineId) {
      console.error("LINE ID not found.");
      alert(i18n.idNotFound);
      return;
    }
    
    // 使用 Clipboard API 复制文本
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(lineId)
        .then(function() {
          console.log("LINE ID copied to clipboard successfully!");
          
          // 尝试跳转到LINE
          window.location.href = "line://";
          
          // 隐藏模态框
          closeModal("fsw-lineModal");
        })
        .catch(function(err) {
          console.error("Failed to copy LINE ID: ", err);
          alert(i18n.cannotCopy);
          
          // 尝试跳转到LINE
          window.location.href = "line://";
          
          // 隐藏模态框
          closeModal("fsw-lineModal");
        });
    } else {
      // 回退到旧方法
      var textarea = document.createElement("textarea");
      textarea.value = lineId;
      textarea.style.position = "fixed";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      
      try {
        document.execCommand("copy");
        console.log("LINE ID copied to clipboard successfully!");
      } catch (err) {
        console.error("Failed to copy LINE ID: ", err);
        alert(i18n.cannotCopy);
      }
      
      document.body.removeChild(textarea);
      
      // 尝试跳转到LINE
      window.location.href = "line://";
      
      // 隐藏模态框
      closeModal("fsw-lineModal");
    }
  }
  
  // 关闭模态框
  function closeModal(modalId) {
    document.getElementById(modalId).style.display = "none";
  }
  
  // 返回顶部
  function backToTop() {
    var currentPosition = document.documentElement.scrollTop || document.body.scrollTop;
    
    if (currentPosition > 0) {
      window.requestAnimationFrame(backToTop);
      window.scrollTo(0, currentPosition - currentPosition / 8);
    }
  }
  
  // 确保Font Awesome已加载
  function ensureFontAwesomeLoaded() {
    if (!document.getElementById('fsw-fontawesome-css')) {
      // console.log('开始加载Font Awesome...');
      
      var fontAwesomeLink = document.createElement('link');
      fontAwesomeLink.id = 'fsw-fontawesome-css';
      fontAwesomeLink.rel = 'stylesheet';
      fontAwesomeLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
      fontAwesomeLink.crossOrigin = 'anonymous';
      fontAwesomeLink.referrerPolicy = 'no-referrer';
      document.head.appendChild(fontAwesomeLink);
      
      // 添加加载完成的检测
      fontAwesomeLink.onload = function() {
        // console.log('Font Awesome 成功加载完成');
        
        // 处理所有使用Font Awesome的自定义按钮
        var customButtons = document.querySelectorAll('.fsw-floating-button--custom');
        console.log('找到', customButtons.length, '个自定义按钮');
        
        customButtons.forEach(function(button) {
          var icon = button.querySelector('i');
          if (icon) {
            icon.style.visibility = 'visible';
            console.log('图标可见性已设置为可见:', icon.className);
          }
        });
        
        // 触发一个自定义事件，表示Font Awesome已加载
        var event = new Event('fsw-fontawesome-loaded');
        document.dispatchEvent(event);
      };
      
      fontAwesomeLink.onerror = function(error) {
        console.error('Font Awesome 加载失败:', error);
        
        // 尝试回退到其他CDN
        console.log('尝试使用备用CDN...');
        var backupLink = document.createElement('link');
        backupLink.id = 'fsw-fontawesome-backup';
        backupLink.rel = 'stylesheet';
        backupLink.href = 'https://use.fontawesome.com/releases/v5.15.4/css/all.css';
        
        backupLink.onload = function() {
          console.log('Font Awesome 备用CDN加载成功');
          
          // 处理所有使用Font Awesome的自定义按钮
          var customButtons = document.querySelectorAll('.fsw-floating-button--custom');
          customButtons.forEach(function(button) {
            var icon = button.querySelector('i');
            if (icon) {
              icon.style.visibility = 'visible';
            }
          });
          
          // 触发一个自定义事件，表示Font Awesome已加载
          var event = new Event('fsw-fontawesome-loaded');
          document.dispatchEvent(event);
        };
        
        backupLink.onerror = function(error) {
          console.error('Font Awesome 备用CDN也加载失败:', error);
          // 使用内联SVG或其他图标作为最终回退
          tryLocalFallback();
        };
        
        document.head.appendChild(backupLink);
      };
    } else {
      // console.log('Font Awesome 已经加载过');
    }
  }
  
  // 尝试使用本地图标作为最终回退
  function tryLocalFallback() {
    console.log('尝试使用本地图标作为回退...');
    
    // 找到所有自定义按钮
    var customButtons = document.querySelectorAll('.fsw-floating-button--custom');
    customButtons.forEach(function(button) {
      var icon = button.querySelector('i');
      if (icon) {
        // 删除i标签
        button.removeChild(icon);
        
        // 添加一个基本图像作为替代
        var img = document.createElement('img');
        img.src = pluginUrl + 'images/social/custom.svg';
        img.alt = button.title || 'Custom Button';
        button.appendChild(img);
      }
    });
  }
  
  // 初始化
  function init() {
    // 确保Font Awesome已加载
    ensureFontAwesomeLoaded();
    
    loadQRCode(function() {
      createFloatingButtons();
      createQRCodeModal();
      createWechatModal();
      createLineModal();
      createGleezyModal();
    });
  }
  
  // 当 DOM 完全加载后初始化
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
  
  // 暴露公共方法
  window.floatContact = {
    showQRCode: showQRCodeModal,
    showWechat: showWechatModal,
    showGleezy: showGleezyModal,
    showLine: showLineModal,
    copyAndOpenWechat: copyAndOpenWechat,
    copyAndOpenGleezy: copyAndOpenGleezy,
    copyAndOpenLine: copyAndOpenLine,
    closeModal: closeModal,
    backToTop: backToTop
  };
})();
