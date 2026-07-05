@echo off
title Iniciando FITSTORE ERP...
echo ===================================================
echo           FITSTORE ERP - SISTEMA DE GESTAO          
echo ===================================================
echo.
echo [1/2] Abrindo o painel no navegador padrao...
start http://localhost:5173
echo.
echo [2/2] Iniciando o servidor local (Vite)...
echo.
npm run dev
if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Nao foi possivel iniciar o servidor.
    echo Verifique se as dependencias foram instaladas rodando "npm install"
    pause
)
