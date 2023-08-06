#!/bin/bash
set bits=384

function get_sha384(){
  wget --no-check-certificate -c -P tmp/ $1
  kk1=$(echo $1|grep -Eo '([^\\/]+$)')
  # shasum -b -a 384 tmp/$kk1 | awk '{ print $1 }' | xxd -r -p | base64
  tmp223=$(cat tmp/$kk1 | openssl dgst -sha384 -binary | openssl base64 -A)
  echo sha${bits}-${tmp223}
}

# 获取所有 js 的 src
srcs=$(grep -Eo 'https://([^"]+?.js)"' index.html|sed 's/"//g')

# 为每个 js 生成 SHA384
for src in $srcs; do
    echo "Generating SHA384 for $src..."
    # 调用 get_sha384 函数
    sha384=$(get_sha384 $src)
    # 更新 HTML 文件
    sed -i "s/$src/$src integrity=\"$sha384\"/" index.html
done

echo "Done!"


