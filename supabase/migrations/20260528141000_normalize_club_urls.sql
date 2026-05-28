update public.product_deliveries
set access_url = regexp_replace(access_url, '^/club\?id=([^&]+).*$', '/club=\1')
where access_url ~ '^/club\?id=';
