---
title: 从零手写一个 Spring Boot Starter：深入理解自动装配原理
description: 一篇关于如何开发自定义 Spring Boot Starter 的技术教程。文章以开发一个控制台 Banner 输出组件为例，手把手讲解了 Spring Boot 自动装配机制的实现原理和完整开发流程。文章通过实战案例揭示了 MyBatis-Plus 等第三方 Starter 背后的实现原理，帮助开发者理解 Spring Boot 的扩展机制。
date: 2026-04-09 07:13:41
updated: 2026-04-09 07:13:41
image: https://file.dhbxs.top/2026/04/csoexczb.webp
permalink: /posts/7dc99e0
categories: [开发]
tags: [SpringBoot, Java]
recommend: 4
---

> 做 SpringBoot 项目开发的同学都知道，平时项目中会用到很多第三方的 starter 依赖，比如 MyBatisPlus 的依赖，`mybatis-plus-spring-boot3-starter`。有没有好奇过这个依赖是怎么开发出来的，为什么引入后就可以使用很多依赖里的功能？
>
>  本文将手把手带你写一个输出一个类似 MyBatisPlus 启动后控制台输出一个 Banner 的 SpringBootStarter

本次开发的源码已同步GitHub仓库
::link-card
---
title: BannerStarter
icon: https://github.githubassets.com/favicons/favicon.svg
link: https://github.com/dhbxs/BannerStarter
class: gradient-card active
---
::

## 场景启动器 Starter
一个最简单的场景启动器一般包含已下几个部分

| 组件 | 扮演角色 | 功能描述 |
| --- | --- | --- |
| BannerService | 业务组件 | ●执行输出 Banner 的业务逻辑功能 |
| BannerProperties | 属性组件 | ●封装配置文件属性值，读取配置文件中是否开启输出 Banner 的功能 |
| BannerAutoConfiguration | 自动配置类 | ●主要任务：注册属性组件 <br>  ●次要任务：确保业务组件放入IoC容器，调用方可以直接注入业务组件并调用组件执行逻辑 |
| AutoConfiguration.imports | 声明自动配置类 | 让 SpringBoot 指导要加载哪个自动配置类 |


## 自顶向下开发
### 项目依赖
SpringBoot 官方的启动器一般 artifactId 为 spring-boot-starter-xxx，例如：

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
    <version>4.0.5</version>
    <scope>compile</scope>
</dependency>
```

如果是三方的 starter 的话，通常 artifactId 为 xxx-spring-boot-starter

所以我们的项目 artifactId 命名为 banner-spring-boot-starter

```xml [pom.xml]
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>top.dhbxs.demo</groupId>
    <artifactId>banner-spring-boot-starter</artifactId>
    <version>1.0-SNAPSHOT</version>

    <properties>
        <maven.compiler.source>21</maven.compiler.source>
        <maven.compiler.target>21</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>

    <dependencies>
        <!-- springboot 自动配置 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-autoconfigure</artifactId>
            <version>3.5.13</version>
        </dependency>

        <!-- springboot 配置处理器 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-configuration-processor</artifactId>
            <version>2.0.4.RELEASE</version>
            <!-- 添加optional属性，不传递此依赖，此依赖只在编译时期生成配置元数据 -->
            <optional>true</optional>
        </dependency>
    </dependencies>


    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <version>3.5.13</version>
            </plugin>
        </plugins>
    </build>

</project>
```

### AutoConfiguration.imports 文件
首先要有一个 `org.springframework.boot.autoconfigure.AutoConfiguration.imports` 文件用于声明自动配置类，这个文件的文件名不能改，SpringBoot 启动时会解析这个文件，然后自动加载里面配置好的类，SpringBoot 官方的 starter 有 142 个自动配置类。如果项目引入了我们当前开发的这个 starter，那 SpringBoot 启动时就会加载自身 142 个再加上我们配置好的类。



在 resources 目录下新建 META-INF/spring 文件夹，然后在这个文件夹下新建名为 `org.springframework.boot.autoconfigure.AutoConfiguration.imports` 的文件，内容如下：

```plain
top.dhbxs.demo.config.BannerAutoConfiguration
```

这里的内容就是我们 BannerStarter 里的自动装配类的 全限定类名。



然后顺手在 resources 目录下新建个 dhbxs 的文件夹，存放我们要在控制台打印的 banner 字符，命名为 banner.txt

```plain
      ██   ██        ██
     ░██  ░██       ░██
     ░██  ░██       ░██        ██   ██    ██████
  ██████  ░██████   ░██████   ░░██ ██    ██░░░░
 ██░░░██  ░██░░░██  ░██░░░██   ░░███    ░░█████
░██  ░██  ░██  ░██  ░██  ░██    ██░██    ░░░░░██
░░██████  ░██  ░██  ░██████    ██ ░░██   ██████
 ░░░░░░   ░░   ░░   ░░░░░     ░░   ░░   ░░░░░░
:: My Framework ::  (v1.0.0)
```

### BannerAutoConfiguration 类
在 java 目录下，新建 config 包，在该包里新建 BannerAutoConfiguration.java 类。



这个类是 starter 自动装配执行的第一个类，类上方有两个比较特殊的注解：

1. @ConditionalOnClass(BannerService.class)

这个注解主要是在执行 BannerAutoConfiguration 类之前，检查类路径下有没有 BannerService 这个类，如果有，则把当前 BannerAutoConfiguration 这个类加入 IoC 容器。

主要是防止在使用我们框架的项目中，如果没有完整下载到我们的 starter，依赖缺失导致报 `ClassNotFoundException`异常，如果依赖缺失，也就不进行自动装配了。

2. @EnableConfigurationProperties(BannerProperties.class)

这个注解主要是加载属性组件，读取用户在配置文件中配置的数据，把 BannerProperties 也注册为 SpringBean



该类中把业务逻辑类 BannerService 也 new 出来，然后创建为一个 SpringBean，方便框架调用方直接可以注入该 Bean 调用业务逻辑。

```java [BannerAutoConfiguration.java]
package top.dhbxs.demo.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import top.dhbxs.demo.properties.BannerProperties;
import top.dhbxs.demo.service.BannerService;

/**
 * Banner 自动配置类
 *
 * @author dhbxs
 * @since 2026/4/9
 */
@Configuration
// 如果当前类路径下有 BannerService 这个类，就把当前类加入 IoC 容器
@ConditionalOnClass(BannerService.class)
// 注册属性组件，SpringBoot 会读取用户在配置文件中指定的值，注入属性组件
@EnableConfigurationProperties(BannerProperties.class)
public class BannerAutoConfiguration {

    private final BannerProperties bannerProperties;

    public BannerAutoConfiguration(BannerProperties bannerProperties) {
        this.bannerProperties = bannerProperties;
    }

    @Bean
    // 条件注入 当 IoC 容器中没有这个 bean 时，才把返回对象注入到 IoC 容器中，如果有，则不注入
    @ConditionalOnMissingBean
    public BannerService bannerService() {
        // 创建BannerService时，把用户配置的是否启用也传进去
        return new BannerService(bannerProperties.getEnable());
    }
}
```

### BannerProperties 类
这个类就是和我们平时自己写的从 application.yml 中读取配置信息的类一样，使用@ConfigurationProperties(prefix = "banner") 注解定义已 banner 开头的配置属性

新建 properties 包，放在该包下

```java [BannerProperties.java]
package top.dhbxs.demo.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Banner 是否启用配置类
 *
 * @author dhbxs
 * @since 2026/4/9
 */
@Component
@ConfigurationProperties(prefix = "banner")
public class BannerProperties {
    /**
     * 是否启用 Banner
     */
    private Boolean enable = true;

    public Boolean getEnable() {
        return enable;
    }

    public void setEnable(Boolean enable) {
        this.enable = enable;
    }
}
```

### BannerService 类
这个类是我们打印 Banner 的核心业务逻辑类，在构造器中调用该类中的方法实现在启动 SpringBoot 项目时，自动打印 Banner。

主要实现读取我们定义的 dhbxs/banner.txt 文件，然后将里面的内容打印到控制台。

```java [BannerService.java]
package top.dhbxs.demo.service;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.stream.Collectors;

/**
 * 打印 Banner 业务类
 *
 * @author dhbxs
 * @since 2026/4/9
 */
public class BannerService {

    // 是否启用
    private final Boolean enable;

    public BannerService(Boolean enable) {
        this.enable = enable;
        this.print();
    }

    /**
     * 从classpath读取banner.txt并打印到控制台
     *
     * @param bannerPath classpath下的路径，如 "banner.txt" 或 "static/banner.txt"
     */
    public void print(String bannerPath) {
        try (InputStream is = BannerService.class.getClassLoader().getResourceAsStream(bannerPath)) {
            if (is == null) {
                System.out.println("Banner not found: " + bannerPath);
                return;
            }
            String banner = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))
                    .lines()
                    .collect(Collectors.joining("\n"));
            System.out.println(banner);
        } catch (Exception e) {
            System.out.println("Failed to print banner: " + e.getMessage());
        }
    }

    /**
     * 使用默认路径 banner.txt
     */
    public void print() {
        if (Boolean.TRUE.equals(this.enable)) {
            print("dhbxs/banner.txt");
        }
    }
}
```

## 打包并给其他项目使用
使用 Maven package 将项目打包后，可以用 install 命令安装到本地 Maven 仓库，然后其他项目中使用 Maven 坐标即可将依赖引入项目

```xml [pom.xml]
<dependency>
  <groupId>top.dhbxs.demo</groupId>
  <artifactId>banner-spring-boot-starter</artifactId>
  <version>1.0-SNAPSHOT</version>
</dependency>
```

如果一切正常，启动 SpringBoot 项目后应该可以看到 SpringBoot 的官方 Banner，然后便可以看到我们 banner-spring-boot-starter 依赖所打印的 Banner，并且可以在 application.yml 中灵活配置是否打印 Banner

```yaml [application.yml]
banner:
  enable: true
```
