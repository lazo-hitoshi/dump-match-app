-- 既存 seed データに緯度経度を付与（地図表示用）

update public.sites set lat = 35.6340, lng = 139.7940
where site_code = 'S-0101' and (lat is null or lng is null);

update public.sites set lat = 35.5180, lng = 139.7260
where site_code = 'S-0102' and (lat is null or lng is null);

update public.sites set lat = 35.8220, lng = 139.8390
where site_code = 'S-0103' and (lat is null or lng is null);

update public.sites set lat = 35.6340, lng = 139.7940
where site_code = 'S-0104' and (lat is null or lng is null);

update public.sites set lat = 35.8300, lng = 139.8700
where site_code = 'S-0105' and (lat is null or lng is null);

update public.trucks set base_lat = 35.5850, base_lng = 139.7350
where truck_code = 'D-0201' and (base_lat is null or base_lng is null);

update public.trucks set base_lat = 35.6530, base_lng = 139.8700
where truck_code = 'D-0202' and (base_lat is null or base_lng is null);

update public.trucks set base_lat = 35.8300, base_lng = 139.8700
where truck_code = 'D-0203' and (base_lat is null or base_lng is null);

update public.trucks set base_lat = 35.5080, base_lng = 139.6750
where truck_code = 'D-0204' and (base_lat is null or base_lng is null);

update public.trucks set base_lat = 35.7480, base_lng = 139.8040
where truck_code = 'D-0205' and (base_lat is null or base_lng is null);
