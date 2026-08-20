#!/data/data/com.termux/files/usr/bin/bash
# ==============================================================================
# MiSub & CF-Optimizer — Termux Setup & Automation
# ==============================================================================
set -e

echo -e "\033[1;36m===============================================================\033[0m"
echo -e "\033[1;32m   MISUB & CF-OPTIMIZER — TERMUX AUTOMATION ENGINE             \033[0m"
echo -e "\033[1;36m===============================================================\033[0m"

# 1. Update Termux Packages
if ! command -v node &> /dev/null; then
    echo -e "\033[1;33m[+] در حال نصب Node.js و Git...\033[0m"
    pkg update -y && pkg install nodejs-lts git openssl curl -y
fi

# 2. Install Dependencies
echo -e "\033[1;32m[+] در حال نصب وابستگی‌های پروژه (npm install)...\033[0m"
npm install

echo -e "\033[1;36m---------------------------------------------------------------\033[0m"
echo -e "\033[1;32m[+] نصب با موفقیت انجام شد!\033[0m"
echo -e "برای اجرای لوکال سرور توسعه: \033[1;33mnpm run dev\033[0m"
echo -e "برای بیلد نهایی پروژه:       \033[1;33mnpm run build\033[0m"
echo -e "\033[1;36m---------------------------------------------------------------\033[0m"
