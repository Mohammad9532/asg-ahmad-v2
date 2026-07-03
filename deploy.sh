#!/bin/bash

set -e

echo "======================================"
echo "ASG ERP V2 Deployment Started"
echo "======================================"

cd /var/www/asg-ahmad-v2

echo "Updating source..."
git pull

echo "Installing Laravel dependencies..."
cd laravel
umask 002
composer install --no-dev --optimize-autoloader

echo "Running migrations..."
php artisan migrate --force

echo "Optimizing Laravel..."
php artisan optimize
rm -f public/storage
php artisan storage:link

echo "Building React..."
cd ../client
npm install
npm run build

echo "Publishing frontend..."
rm -rf ../laravel/public/app
mkdir -p ../laravel/public/app
cp -r dist/* ../laravel/public/app/

echo "Reloading services..."
sudo systemctl reload nginx
sudo supervisorctl restart asg-queue:*

echo "======================================"
echo "Deployment Completed Successfully!"
echo "======================================"
