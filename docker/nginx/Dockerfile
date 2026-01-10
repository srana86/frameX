FROM openresty/openresty:alpine

# Install helpful tools
RUN apk add --no-cache curl

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

# Create directory for Lua scripts
RUN mkdir -p /etc/nginx/lua

# Copy configuration
COPY nginx.conf /usr/local/openresty/nginx/conf/nginx.conf
COPY conf.d/ /etc/nginx/conf.d/
COPY html/ /usr/local/openresty/nginx/html/

# Copy Lua scripts
COPY lua/ /etc/nginx/lua/

EXPOSE 80
CMD ["/usr/local/openresty/bin/openresty", "-g", "daemon off;"]
