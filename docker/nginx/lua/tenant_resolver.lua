local redis = require "resty.redis"
local red = redis:new()

red:set_timeout(1000) -- 1 sec

-- Connect to Redis (service name "redis" in docker-compose)
local ok, err = red:connect("redis", 6379)
if not ok then
    ngx.log(ngx.ERR, "failed to connect to redis: ", err)
    -- Fallback: Do not block request, let app handle it or return 500?
    -- For now, let's proceed without header (App Middleware will fail/fallback)
    return
end

-- Get Hostname
local host = ngx.var.host
local domain_key = "domain:" .. host

-- Lookup Tenant ID
local res, err = red:get(domain_key)

if not res then
    ngx.log(ngx.ERR, "failed to get domain key: ", err)
    return
end

if res == ngx.null then
    -- CACHE MISS: Check for Subdomain Logic
    -- Regex: ^([^.]+)\.framextech\.com$ -> capture group 1
    -- Adjust domain suffix as needed (e.g. localhost, framex.com)
    local m, err = ngx.re.match(host, "^([^.]+)\\.framextech\\.com$")
    
    if m then
        -- Valid subdomain format
        -- Ideally, we should query Redis for "subdomain:xyz" or just pass it to API
        -- For optimization, we rely on App Middleware fallbacks here if Redis misses.
        -- OR: We could set a header x-subdomain
        ngx.req.set_header("x-subdomain", m[1])
    else
        -- Logic for handling unknown domains
        -- For now, trigger Nginx 404 to show static page
        ngx.exit(404)
    end
else
    -- CACHE HIT
    ngx.req.set_header("x-merchant-id", res)
end

-- Keep connection alive
local ok, err = red:set_keepalive(10000, 100)
if not ok then
    ngx.log(ngx.ERR, "failed to set keepalive: ", err)
end
