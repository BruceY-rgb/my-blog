---
title: 题库第一章
date: 2026-06-02 17:40:00
cover: https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1920
categories:
  - CS课程笔记
  - 软件工程
  - 客观题复习
tags:
  - 软件工程
---

## 1. Software Engineering的核心关注点

软件工程主要关注如何系统化地开发(`develop`)、维护(`maintain`)和管理软件(`manage`)

| English Term              | 中文含义        | 说明                         |
| ------------------------- | --------------- | ---------------------------- |
| software development cost | 软件开发成本    | 为什么开发一个软件很贵       |
| development time          | 开发时间        | 为什么软件需要很久才能完成   |
| software errors / defects | 软件错误 / 缺陷 | 为什么交付前不能完全消除错误 |
| software quality          | 软件质量        | 软件是否可靠、可维护、易用   |
| software maintenance      | 软件维护        | 软件交付后的修改、修复和升级 |


!!! warning
硬件成本已经不再是现代软件工程最核心的问题
!!!

> 知识点：现代软件工程师主要关注软件成本、开发时间、质量和错误，而不是硬件成本

## 2. Software is not manufactured in the traditional sense

软件是被工程化(`engineered`)开发出来的，而不是像传统工业产品一样被制造(`manufactured`)出来的

> 知识点：软件是一种产品，但是不能用其他工程制品相同的制造技术来制造

## 3. Software does not wear out, but it deteriorates

软件不会磨损，但是软件会退化

> 知识点：软件会退化因为多个变更请求可能在组件交互中引入错误(`introduce errors in component interactions`)

## 4. WebApps Web应用

`WebApps`是运行在`Web`环境中的应用程序，例如在线购物网站、在线文档、博客系统等

!!! warning
`WebApps`没有超出软件工程的范围
!!!

- `WebApps`虽然结合了出版展示和软件开发的特点，但是它们仍然属于软件工程实践范围
- `WebsApps`也需要：*需求分析、系统设计、测试*


## 5. WebApps and MobileApps are different

- WebApp 的特点：通过浏览器访问，跨平台能力强，更新方便。

- MobileApp 的特点：安装在手机上，可以调用系统功能，比如相机、定位、推送通知、传感器等。
 
## 6. Cloud computing

云计算值用户通过网络访问远程计算资源、存储资源和软件服务

在最简单的形式中，外部计算设备可以用`Web`浏览器访问云数据服务

> 知识点：云计算允许用户通过互联网访问数据和服务

## 7. Product Line Software Development and Reuse

产品线软件开发依赖于现有软件组件的复用，以提供工程的杠杆作用(`engineering leverage`)

> 这里`leverage`可以理解为用较少的投入获得更大的开发收益

