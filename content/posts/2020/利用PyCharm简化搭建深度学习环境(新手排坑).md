---
title: 利用PyCharm简化搭建深度学习环境(新手排坑)
description: 在Windows 10上使用PyCharm搭建深度学习环境，包括基于Anaconda创建环境、使用清华/阿里镜像安装TensorFlow 2.3.1和Keras 2.4.3、解决DLL加载问题。针对GPU加速，安装CUDA 10.1和cuDNN 7.6并配置环境变量，验证GPU调用，附有常用pip命令速查表。
date: 2020-10-06 11:18:24
updated: 2020-10-06 11:18:24
image: https://file.dhbxs.top/2025/10/sukseffe.webp
permalink: /posts/37561f92
categories: [技术]
tags: [深度学习, PyCharm]
recommend: 0
---

> - 预备环境：Anaconda3
> - 搭建环境 ：PyCharm + TensorFlow/TensorFlow-GPU + Keras
> - PyCharm Version 2020.2.1
> - TensorFlow Version 2.3.1
> - Keras Version 2.4.3
> - CUDA Version 10.1
> - cuDNN Version 7.6

## 1. 用 PyCharm 新建 Python 环境
> 需要提前安装好 Anaconda 官网下载地址：[Anaconda 官网下载地址](https://www.anaconda.com/products/individual)
>

1. 点击新建项目(New Project)![](https://file.dhbxs.top/2025/10/nbsnufji.png)
2. 按下图操作![](https://file.dhbxs.top/2025/10/blpxfujj.png)

## 2. 安装 TensorFlow 2.3.1
1. 项目搭建好后点击 Terminal 打开终端![](https://file.dhbxs.top/2025/10/rwwfbntr.png)
2. 输入命令 `pip install --upgrade pip -i https://pypi.tuna.tsinghua.edu.cn/simple/` ，从清华的镜像源检查 pip，确保 pip 为最新版，目前 `pip` 最新版为 `20.2.3`![](https://file.dhbxs.top/2025/10/oxhxunrm.png)
3. 输入`TensorFlow`安装命令 `pip install tensorflow -i https://pypi.tuna.tsinghua.edu.cn/simple/` 安装最新版的 `TensorFlow`，目前最新版的 `TensorFlow` 为 2.3.1
4. 如果上面安装不了或者下载缓慢，可以试试这条命令，切换为阿里镜像源 `pip install tensorflow -i https://mirrors.aliyun.com/pypi/simple`![](https://file.dhbxs.top/2025/10/thvalpvn.png)
5. 输入以下 Python 代码运行，验证安装是否成功：

```python
import tensorflow as tf
print(tf.reduce_sum(tf.random.normal([1000, 1000])))
```

![](https://file.dhbxs.top/2025/10/qevxkgqo.png)

### `踩坑记录：(DLL load failed：找不到指定的模块)`
> 这里如果报如下图所示错误，是因为 vc++ 各种运行库缺失导致的，最简单的解决办法就是下载 vc++运行库合集，然后安装就好了，这里给出一个下载链接，不保证官方无毒，请自行斟酌使用。VC++ 运行库合集安装包下载地址：[http://8dx.pc6.com/wwb6/WRYXKHJ2020.10.14.exe](http://8dx.pc6.com/wwb6/WRYXKHJ2020.10.14.exe)
>

![](https://file.dhbxs.top/2025/10/tpjbcifj.png)

## 3. 安装 Keras 2.4.3
1. 继续在 terminal 中输入命令安装 Keras `pip install keras -i https://pypi.tuna.tsinghua.edu.cn/simple/` ，阿里镜像源命令： `pip install keras -i https://mirrors.aliyun.com/pypi/simple`![](https://file.dhbxs.top/2025/10/umijxxpv.png)
2. 输入一下 Python 代码，运行无报错则安装成功：

```python
import keras
```

![](https://file.dhbxs.top/2025/10/ghvnsekw.png)

> 至此，TensorFlow 不带 GPU 的版本和 keras 已经安装完成，如需添加 GPU 支持，请继续如下操作
>

## 添加 GPU 支持
> 以下内容全部基于普通笔记本电脑上的 NVIDIA GeForce MX150 独立显卡平台
>

### 1. 查找自己平台是否有 NVIDIA 独立显卡以及是否支持 CUDA
1. 打开任务管理器查看显卡型号，一般笔记本有核心显卡和独立显卡，找到有 NVIDIA 字样的一般就是英伟达的独立显卡了，接着复制显卡型号即图中的 `NVIDIA GeForce MX150` 到 NVIDIA 官网查询该型号是否支持 CUDA![](https://file.dhbxs.top/2025/10/dwtlktph.png)
2. 可以看到如下图所示该显卡是支持 CUDA 的，所以可以给 TensorFlow 添加 GPU 支持![](https://file.dhbxs.top/2025/10/dqmmsbex.png)

### 2. 去官网下载 CUDA10.1 以下的版本
> 目前 TensorFlow 最新版仅支持 10.1 即以下版本，不要安装最新的 CUDA11
> cuDNN 仅支持最高7.6版本

1. CUDA 10.1 官网下载链接：[https://developer.nvidia.com/cuda-10.1-download-archive-base?target_os=Windows&target_arch=x86_64&target_version=10&target_type=exelocal](https://developer.nvidia.com/cuda-10.1-download-archive-base?target_os=Windows&target_arch=x86_64&target_version=10&target_type=exelocal)![](https://file.dhbxs.top/2025/10/amybaynd.png)
2. 点击 Download 下载（点击一次可能会出现请求失败的 ERROR，重新点击就好了）
3. 也可以点击这个链接直接下载，或者将该链接复制到迅雷里可以更快速的下载，实测迅雷能跑到 6mb/s：[https://developer.nvidia.com/compute/cuda/10.1/Prod/local_installers/cuda_10.1.105_418.96_win10.exe](https://developer.nvidia.com/compute/cuda/10.1/Prod/local_installers/cuda_10.1.105_418.96_win10.exe)

### 3. 安装 CUDA
1. 双击打开安装包，点击 ok 加载缓存到临时目录![](https://file.dhbxs.top/2025/10/smcmhpxp.png)
2. 等待检查系统兼容性，然后点击同意并继续![](https://file.dhbxs.top/2025/10/gdmumlba.png)
3. 选择自定义安装![](https://file.dhbxs.top/2025/10/hqdjggft.png)
4. 只勾选如图所示的组件，其余一律不勾选![](https://file.dhbxs.top/2025/10/jecarwdi.png)
5. 依次点击下一步，直至安装即可，默认安装位置尽量不要改动，后续要配置环境变量，如若更改，务必截图保存，以防忘记

### 4. 下载 cuDNN 并配置环境变量
1. 点开此链接下载 cuDNN7.6 版本：[https://developer.nvidia.com/rdp/cudnn-archive#a-collapse51b](https://developer.nvidia.com/rdp/cudnn-archive#a-collapse51b)![](https://file.dhbxs.top/2025/10/jliivhsm.png)
2. 将下载的压缩包解压出来，把 cuda 文件夹复制到 C 盘根目录
3. 将以下路径添加到系统环境变量中

```shell
C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v10.1\bin
C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v10.1\extras\CUPTI\lib64
C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v10.1\include
C:\cuda\bin
```

![](https://file.dhbxs.top/2025/10/mwdgxvhl.png)![](https://file.dhbxs.top/2025/10/vdgncjwe.png)![](https://file.dhbxs.top/2025/10/htehyszh.png)![](https://file.dhbxs.top/2025/10/urpkuzqw.png)

### 5. 运行验证是否支持 GPU
1. 在上文所建立的 pycharm 项目中，写入如下 Python 代码，执行

```python
import tensorflow as tf
print(tf.reduce_sum(tf.random.normal([1000, 1000])))
```

2. 出现如下图所示提示即表示安装成功![](https://file.dhbxs.top/2025/10/nholaknj.png)

## 附录：`pip`命令总结
| pip 命令示例 | **说明** |
| --- | --- |
| pip download SomePackage[==version] | 下载扩展库的指定版本，不安装 |
| pip freeze [> requirements.txt] | 以 requirements 的格式列出已安装模块 |
| pip list | 列出当前已安装的所有模块 |
| pip install SomePackage[==version] | 在线安装 SomePackage 模块的指定版本 |
| pip install SomePackage.whl | 通过 whl 文件离线安装扩展库 |
| pip install package1 package2 … | 依次（在线）安装 package1、package2 等扩展模块 |
| pip install -r requirements.txt | 安装 requirements.txt 文件中指定的扩展库 |
| pip install –upgrade SomePackage | 升级 SomePackage 模块 |
| pip uninstall SomePackage[==version] | 卸载 SomePackage 模块的指定版本 |
