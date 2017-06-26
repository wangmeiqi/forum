## 启动 mongod
sudo mongod -f /usr/local/bin/mongodb.conf
## 关闭 
mongo 命令下
use admin
db.shutdownServer();

## 实时追踪log
sudo tail -f /usr/local/log/mongodb.log

### 分析论坛项目
 - 数据库
 > users 负责用户管理：用户名、密码、头像  
 > messages 负责用户的评论信息：用户名、头像、留言内容、时间  
 - 功能
 > top部分：
   >> 未登录：logo，全部说说，注册，登录  
   >> 已登陆：logo，全部说说，我的说说，用户列表，  欢迎您：xxx； 设置  
   >> 设置：图像裁切：选图片，裁切图片；退出功能
 >index页面  
   >>登录前：欢迎注册：通过点击按钮跳转到注册页面   欢迎登陆：直接登录  
   >>登录后：左边头像，右边：留言框  
   >>都有留言列表
 >> 我的说说：必须先登录才能查看  
 >> 用户列表：登录后才可以查看