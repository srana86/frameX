FROM openresty/openresty:alpine

# Install helpful tools
RUN apk add --no-cache curl

# Remove default config
RUN rm -f /etc/nginx/conf.d/default.conf

# Create necessary directories
RUN mkdir -p /etc/nginx /var/log/nginx /var/run

# Ensure mime.types exists at /etc/nginx/mime.types
# OpenResty stores it at /usr/local/openresty/nginx/conf/mime.types
RUN if [ -f /usr/local/openresty/nginx/conf/mime.types ]; then \
      cp /usr/local/openresty/nginx/conf/mime.types /etc/nginx/mime.types; \
    else \
      # Fallback: create minimal mime.types if not found
      echo "types {" > /etc/nginx/mime.types && \
      echo "    text/html html htm shtml;" >> /etc/nginx/mime.types && \
      echo "    text/css css;" >> /etc/nginx/mime.types && \
      echo "    text/xml xml;" >> /etc/nginx/mime.types && \
      echo "    application/json json;" >> /etc/nginx/mime.types && \
      echo "    application/javascript js;" >> /etc/nginx/mime.types && \
      echo "    image/svg+xml svg;" >> /etc/nginx/mime.types && \
      echo "}" >> /etc/nginx/mime.types; \
    fi

# Copy configuration
COPY nginx.conf /usr/local/openresty/nginx/conf/nginx.conf
COPY conf.d/ /etc/nginx/conf.d/
COPY html/ /usr/local/openresty/nginx/html/

EXPOSE 80
CMD ["/usr/local/openresty/bin/openresty", "-g", "daemon off;"]
