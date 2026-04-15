---
title: CSS多行溢出，兼容性比较好的做法
description: 原生css提供的做法在兼容性上做的不太好，FireFox或者Safari支持都不太好，可以换个思路，有另外一种实现方法。用JS去计算文字显示长度，然后再截取计算效果也不好，中英文文字字宽都不相同，同样英文字母的宽度I 和 G的宽度也不一样。可以利用css的float浮动布局，浮动布局有个天然的特性就是文字环绕，附近的文字会自动避开浮动的元素。
date: 2024-08-02 05:52:01
updated: 2024-08-02 05:52:01
image: # 封面图推荐 2:1，不含与标题重复的文字
permalink: /posts/d2e7adb
categories: [开发]
tags: [CSS]
recommend: 0
---

原生css提供的做法在兼容性上做的不太好，FireFox或者Safari支持都不太好，可以换个思路，有另外一种实现方法。

用JS去计算文字显示长度，然后再截取计算效果也不好，中英文文字字宽都不相同，同样英文字母的宽度I 和 G的宽度也不一样。

可以利用css的float浮动布局，浮动布局有个天然的特性就是文字环绕，附近的文字会自动避开浮动的元素。

## 实现步骤：

1. 准备一个父容器，设置一些背景色，边框，内边距，方便看效果

```html
<body>
    <div class="container">
        
    </div>

</body>

```

```css
:root {
    --line: 6em; /* 超过6行后显示省略号 */
}

.container {
    margin: 1em auto;
    width: 60%;
    height: calc(var(--line) + 2em);
    border: 1px solid black;
    background-color: aqua;
    padding: 1em;
}
```

2. 准备文本盒子，填充文字内容，把省略号单独放在一个容器内。

```html
<div class="container">
    <div class="text-container">
        <div class="more">······</div>

        <div class="content">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Aliquid, laudantium itaque harum praesentium non tenetur quae quas, incidunt provident doloribus accusantium optio, nihil consectetur. Pariatur rerum accusamus rem impedit alias.Lorem ipsum dolor sit amet consectetur adipisicing elit. Aliquid, laudantium itaque harum praesentium non tenetur quae
            quas, incidunt provident doloribus accusantium optio, nihil consectetur. Pariatur rerum accusamus rem impedit alias.Lorem ipsum dolor sit amet consectetur adipisicing elit. Aliquid, laudantium itaque harum praesentium non tenetur quae
            quas, incidunt provident doloribus accusantium optio, nihil consectetur. Pariatur rerum accusamus rem impedit alias.Lorem ipsum dolor sit amet consectetur adipisicing elit. Aliquid, laudantium itaque harum praesentium non tenetur quae
            quas, incidunt provident doloribus accusantium optio, nihil consectetur. Pariatur rerum accusamus rem impedit alias.
        </div>

    </div>

</div>

```

```css
.text-container {
    word-break: break-all;
    width: 100%;
    height: 100%;
    overflow: hidden;
}
```

3. 利用浮动，将省略号定位到文本盒子的右下角，我这里的做法是增加一个伪类元素，将浮动的省略号挤下去，然后文字内容再通过负的外边距移上来。

```css
.text-container::before {
    content: '';
    height: calc(var(--line) + 1em);
    display: block;
    /* background: red; */
}

.more {
    float: right;
}

.content {
    margin-top: calc(0em - var(--line) - 1em);
    font-family: 'JetBrains Mono', monospace;
}
```

## 完整代码：

```html
<!DOCTYPE html>
<html lang="zh-CN">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>多行文本溢出</title>

    <style>
        :root {
            --line: 6em; /* 超过6行后显示省略号 */
        }

        .container {
            margin: 1em auto;
            width: 60%;
            height: calc(var(--line) + 2em);
            border: 1px solid black;
            background-color: aqua;
            padding: 1em;
        }

        .text-container {
            word-break: break-all;
            width: 100%;
            height: 100%;
            overflow: hidden;
        }

        .text-container::before {
            content: '';
            height: calc(var(--line) + 1em);
            display: block;
            /* background: red; */
        }

        .more {
            float: right;
        }

        .content {
            margin-top: calc(0em - var(--line) - 1em);
            font-family: 'JetBrains Mono', monospace;
        }
    </style>

</head>

<body>
    <div class="container">
        <div class="text-container">
            <div class="more">······</div>

            <div class="content">
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Aliquid, laudantium itaque harum praesentium
                non tenetur quae quas, incidunt provident doloribus accusantium optio, nihil consectetur. Pariatur rerum
                accusamus rem impedit alias.Lorem ipsum dolor sit amet consectetur adipisicing elit. Aliquid, laudantium
                itaque harum praesentium non tenetur quae
                quas, incidunt provident doloribus accusantium optio, nihil consectetur. Pariatur rerum accusamus rem
                impedit alias.Lorem ipsum dolor sit amet consectetur adipisicing elit. Aliquid, laudantium itaque harum
                praesentium non tenetur quae
                quas, incidunt provident doloribus accusantium optio, nihil consectetur. Pariatur rerum accusamus rem
                impedit alias.Lorem ipsum dolor sit amet consectetur adipisicing elit. Aliquid, laudantium itaque harum
                praesentium non tenetur quae
                quas, incidunt provident doloribus accusantium optio, nihil consectetur. Pariatur rerum accusamus rem
                impedit alias.
            </div>

        </div>

    </div>

</body>

</html>

```
