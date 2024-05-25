
# rtsp://admin:MJAmg%40028@192.168.0.124/live/main
rm -rf static/vt/$2
mkdir -p static/vt/$2
cd static/vt/$2
# -crf 参数来降低编码质量，这将减少CPU的使用。-crf参数的值范围是0-51，其中0表示无损质量，23是默认值，51是最差质量。值越大，质量越差，但编码速度越快
#  -crf 30 
# -vf "scale=-2:480"
ffmpeg -i "$1" -c:v libx264 -vf "scale=-2:480" -crf 30 -flags low_delay -preset ultrafast -hls_time 2 -hls_list_size 10 -hls_wrap 10 -start_number 1 $2.m3u8
