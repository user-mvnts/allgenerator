@echo off
echo Adicionando arquivos modificados...
git add .

echo Fazendo commit com timestamp...
git commit -m "Auto-commit: %date% %time%"

echo Status do repositório:
git status

echo.
echo Pressione qualquer tecla para continuar...
pause > nul
