#!/bin/bash

# 写一个bansh
# 1、检查是否已经运行了
# cd app1/app/;NODE_ENV=production node server.js

# 如果运行了退出bash
# 否则执行他
# 2、将bash添加到定时任务
# 添加定时任务时避免重复添加，
# 每1分钟执行一次bash

# 添加到定时任务的 bash 的命令都写在bash脚本中，也就是将自己添加到定时任务，且不重复，自动检查添加过就跳过


# 检查是否已经运行了
if pgrep -f "NODE_ENV=production node server.js" > /dev/null
then
    echo "已经在运行"
    exit
else
    # 如果没有运行，则执行
    cd /root/app1/app && NODE_ENV=production node server.js &
fi

# 将脚本添加到定时任务，避免重复添加
CRON_JOB="* * * * * /root/app1/app/autoRun.sh"
(crontab -l | grep -v -F "$CRON_JOB"; echo "$CRON_JOB") | crontab -

