// Aguarda o DOM estar pronto
document.addEventListener('DOMContentLoaded', function() {
    // --- SISTEMA DE CORES SIMPLES E MODERNO ---
    let colorPickerInstance = null;
    
    function createColorPicker() {
        // Remover picker anterior se existir
        if (colorPickerInstance) {
            colorPickerInstance.remove();
        }
        
        // Criar container do picker
        const picker = document.createElement('div');
        picker.id = 'color-picker-overlay';
        picker.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.4);
            backdrop-filter: blur(8px);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.2s ease-out;
        `;
        
        // Criar picker principal
        const pickerContent = document.createElement('div');
        pickerContent.style.cssText = `
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
            border-radius: 20px;
            padding: 32px;
            box-shadow: 0 32px 64px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.05);
            max-width: 500px;
            width: 90%;
            position: relative;
            border: 1px solid rgba(255, 255, 255, 0.2);
            animation: slideUp 0.3s ease-out;
        `;
        
        // Estado da cor atual
        let currentHue = 0;
        let currentSaturation = 100;
        let currentLightness = 50;
        let currentAlpha = 100;
        
        // Função para converter HSL para RGB
        function hslToRgb(h, s, l) {
            h /= 360;
            s /= 100;
            l /= 100;
            
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            
            return {
                r: Math.round(hue2rgb(p, q, h + 1/3) * 255),
                g: Math.round(hue2rgb(p, q, h) * 255),
                b: Math.round(hue2rgb(p, q, h - 1/3) * 255)
            };
        }
        
        // Função para converter RGB para HSL
        function rgbToHsl(r, g, b) {
            r /= 255;
            g /= 255;
            b /= 255;
            
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            let h, s, l = (max + min) / 2;
            
            if (max === min) {
                h = s = 0;
            } else {
                const d = max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                
                switch (max) {
                    case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                    case g: h = (b - r) / d + 2; break;
                    case b: h = (r - g) / d + 4; break;
                }
                h /= 6;
            }
            
            return {
                h: Math.round(h * 360),
                s: Math.round(s * 100),
                l: Math.round(l * 100)
            };
        }
        
        // Função para converter RGB para Hex
        function rgbToHex(r, g, b) {
            return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        }
        
        // Função para converter Hex para RGB
        function hexToRgb(hex) {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        }
        
        // Função para atualizar a cor atual
        function updateCurrentColor() {
            const rgb = hslToRgb(currentHue, currentSaturation, currentLightness);
            const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
            
            // Atualizar preview com transparência
            const alpha = currentAlpha / 100;
            if (alpha < 1) {
                // Se tem transparência, mostrar o padrão de transparência
                colorPreview.style.background = `hsl(${currentHue}, ${currentSaturation}%, ${currentLightness}%)`;
                transparencyPattern.style.opacity = '0.3';
            } else {
                // Se está 100% opaco, esconder o padrão de transparência
                colorPreview.style.background = `hsl(${currentHue}, ${currentSaturation}%, ${currentLightness}%)`;
                transparencyPattern.style.opacity = '0';
            }
            
            // Atualizar hex input
            hexInput.value = hex;
            
            // Atualizar sliders RGB
            rSlider.slider.value = rgb.r;
            gSlider.slider.value = rgb.g;
            bSlider.slider.value = rgb.b;
            rSlider.valueDisplay.textContent = rgb.r;
            gSlider.valueDisplay.textContent = rgb.g;
            bSlider.valueDisplay.textContent = rgb.b;
            
            // Atualizar sliders HSL
            hSlider.slider.value = currentHue;
            sSlider.slider.value = currentSaturation;
            lSlider.slider.value = currentLightness;
            hSlider.valueDisplay.textContent = currentHue;
            sSlider.valueDisplay.textContent = currentSaturation;
            lSlider.valueDisplay.textContent = currentLightness;
            
            // Atualizar área de seleção
            updateColorArea();
            
            // Atualizar posição do indicador
            setTimeout(() => {
                updateColorIndicatorFromHSL();
            }, 10);
        }
        
        // Função para atualizar a área de seleção de cor
        function updateColorArea() {
            const hueColor = `hsl(${currentHue}, 100%, 50%)`;
            colorArea.style.background = `linear-gradient(to right, white, ${hueColor})`;
            
            // Forçar re-renderização do gradiente
            colorArea.style.background = `linear-gradient(to right, white, ${hueColor})`;
        }
        
        // Preview da cor atual
        const colorPreview = document.createElement('div');
        colorPreview.style.cssText = `
            width: 100%;
            height: 80px;
            border-radius: 16px;
            background: hsl(${currentHue}, ${currentSaturation}%, ${currentLightness}%);
            margin-bottom: 24px;
            border: 3px solid #e2e8f0;
            box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.1);
            position: relative;
            overflow: hidden;
        `;
        
        // Adicionar padrão de transparência ao preview
        const transparencyPattern = document.createElement('div');
        transparencyPattern.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(45deg, #e2e8f0 25%, transparent 25%), 
                        linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), 
                        linear-gradient(45deg, transparent 75%, #e2e8f0 75%), 
                        linear-gradient(-45deg, transparent 75%, #e2e8f0 75%);
            background-size: 16px 16px;
            background-position: 0 0, 0 8px, 8px -8px, -8px 0px;
            opacity: 0.3;
        `;
        colorPreview.appendChild(transparencyPattern);
        
        // Área de seleção de matiz e saturação
        const colorAreaContainer = document.createElement('div');
        colorAreaContainer.style.cssText = `
            position: relative;
            width: 100%;
            height: 200px;
            border-radius: 12px;
            overflow: hidden;
            margin-bottom: 24px;
            cursor: crosshair;
            border: 2px solid #e2e8f0;
        `;
        
        const colorArea = document.createElement('div');
        colorArea.style.cssText = `
            width: 100%;
            height: 100%;
            background: linear-gradient(to right, white, red);
            position: relative;
        `;
        
        // Gradiente de saturação
        const saturationOverlay = document.createElement('div');
        saturationOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(to bottom, transparent, black);
        `;
        
        // Indicador de posição na área de cor
        const colorIndicator = document.createElement('div');
        colorIndicator.style.cssText = `
            position: absolute;
            width: 16px;
            height: 16px;
            border: 3px solid white;
            border-radius: 50%;
            transform: translate(-50%, -50%);
            pointer-events: none;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            z-index: 10;
        `;
        
        colorArea.appendChild(saturationOverlay);
        colorAreaContainer.appendChild(colorArea);
        colorAreaContainer.appendChild(colorIndicator);
        
        // Slider de matiz (Hue)
        const hueSliderContainer = document.createElement('div');
        hueSliderContainer.style.cssText = `
            position: relative;
            height: 20px;
            background: linear-gradient(to right, 
                #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000);
            border-radius: 10px;
            margin-bottom: 16px;
            cursor: pointer;
            border: 2px solid #e2e8f0;
        `;
        
        const hueSlider = document.createElement('input');
        hueSlider.type = 'range';
        hueSlider.min = '0';
        hueSlider.max = '360';
        hueSlider.value = currentHue;
        hueSlider.step = '1';
        hueSlider.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: transparent;
            outline: none;
            cursor: pointer;
            -webkit-appearance: none;
            appearance: none;
        `;
        
        hueSliderContainer.appendChild(hueSlider);
        
        // Container para controles
        const controlsContainer = document.createElement('div');
        controlsContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 20px;
            margin-bottom: 24px;
        `;
        
        // Input de texto para código hex
        const hexInput = document.createElement('input');
        hexInput.type = 'text';
        hexInput.placeholder = '#000000';
        hexInput.style.cssText = `
            width: 100%;
            padding: 16px 20px;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            font-size: 16px;
            text-align: center;
            font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
            background: #f8fafc;
            transition: all 0.2s ease;
            font-weight: 600;
            letter-spacing: 1px;
        `;
        
        // Função para criar slider
        function createSlider(label, color, min, max, value, unit = '') {
            const container = document.createElement('div');
            container.style.cssText = `
            display: flex;
                flex-direction: column;
            gap: 8px;
        `;
        
            const labelEl = document.createElement('label');
            labelEl.textContent = label;
            labelEl.style.cssText = `
            font-size: 14px;
                font-weight: 600;
                color: #374151;
                display: flex;
                justify-content: space-between;
                align-items: center;
            `;
            
            const valueDisplay = document.createElement('span');
            valueDisplay.textContent = value + unit;
            valueDisplay.style.cssText = `
                background: ${color};
                color: white;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 700;
                min-width: 40px;
            text-align: center;
            `;
            
            const sliderContainer = document.createElement('div');
            sliderContainer.style.cssText = `
                position: relative;
                height: 8px;
                background: linear-gradient(to right, #e2e8f0, ${color});
                border-radius: 4px;
                cursor: pointer;
            `;
            
            const slider = document.createElement('input');
            slider.type = 'range';
            slider.min = min;
            slider.max = max;
            slider.value = value;
            slider.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: transparent;
                outline: none;
                cursor: pointer;
                -webkit-appearance: none;
                appearance: none;
            `;
            
            slider.style.setProperty('--thumb-color', color);
            
            slider.oninput = () => {
                valueDisplay.textContent = slider.value + unit;
            };
            
            labelEl.appendChild(valueDisplay);
            container.appendChild(labelEl);
            sliderContainer.appendChild(slider);
            container.appendChild(sliderContainer);
            
            return { container, slider, valueDisplay };
        }
        
        // Criar sliders RGB
        const rSlider = createSlider('Red', '#ef4444', 0, 255, 0);
        const gSlider = createSlider('Green', '#22c55e', 0, 255, 0);
        const bSlider = createSlider('Blue', '#3b82f6', 0, 255, 0);
        
        // Criar sliders HSL
        const hSlider = createSlider('Hue', '#8b5cf6', 0, 360, currentHue, '°');
        const sSlider = createSlider('Saturation', '#f59e0b', 0, 100, currentSaturation, '%');
        const lSlider = createSlider('Lightness', '#6b7280', 0, 100, currentLightness, '%');
        
        // Input de transparência
        const alphaContainer = document.createElement('div');
        alphaContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 8px;
        `;
        
        const alphaLabel = document.createElement('label');
        alphaLabel.style.cssText = `
            font-size: 14px;
            font-weight: 600;
            color: #374151;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;
        
        const alphaValueDisplay = document.createElement('span');
        alphaValueDisplay.textContent = '100%';
        alphaValueDisplay.style.cssText = `
            background: linear-gradient(45deg, #e2e8f0 25%, transparent 25%), 
                        linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), 
                        linear-gradient(45deg, transparent 75%, #e2e8f0 75%), 
                        linear-gradient(-45deg, transparent 75%, #e2e8f0 75%);
            background-size: 8px 8px;
            background-position: 0 0, 0 4px, 4px -4px, -4px 0px;
            color: #374151;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 700;
            min-width: 50px;
            text-align: center;
            border: 2px solid #e2e8f0;
        `;
        
        const alphaSliderContainer = document.createElement('div');
        alphaSliderContainer.style.cssText = `
            position: relative;
            height: 8px;
            background: linear-gradient(to right, transparent, #3b82f6);
            border-radius: 4px;
            cursor: pointer;
        `;
        
        const alphaInput = document.createElement('input');
        alphaInput.type = 'range';
        alphaInput.min = '0';
        alphaInput.max = '100';
        alphaInput.value = '100';
        alphaInput.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: transparent;
            outline: none;
            cursor: pointer;
            -webkit-appearance: none;
            appearance: none;
        `;
        
        alphaInput.oninput = () => {
            alphaValueDisplay.textContent = alphaInput.value + '%';
            currentAlpha = parseInt(alphaInput.value);
            updateCurrentColor(); // Atualizar preview quando transparência muda
        };
        
        alphaLabel.innerHTML = 'Transparência';
        alphaLabel.appendChild(alphaValueDisplay);
        alphaContainer.appendChild(alphaLabel);
        alphaSliderContainer.appendChild(alphaInput);
        alphaContainer.appendChild(alphaSliderContainer);
        
        // Event listeners para sliders HSL
        hSlider.slider.oninput = () => {
            currentHue = parseInt(hSlider.slider.value);
            hueSlider.value = currentHue; // Sincronizar com o slider principal
            updateCurrentColor();
            updateColorArea(); // Atualizar o gradiente da área de seleção
        };
        
        // Event listener adicional para o slider de matiz
        hueSlider.oninput = () => {
            currentHue = parseInt(hueSlider.value);
            hSlider.slider.value = currentHue; // Sincronizar com o slider HSL
            updateCurrentColor();
            updateColorArea();
        };
        
        sSlider.slider.oninput = () => {
            currentSaturation = parseInt(sSlider.slider.value);
            updateCurrentColor();
        };
        
        lSlider.slider.oninput = () => {
            currentLightness = parseInt(lSlider.slider.value);
            updateCurrentColor();
        };
        
        // Event listeners para sliders RGB
        rSlider.slider.oninput = () => {
            const r = parseInt(rSlider.slider.value);
            const g = parseInt(gSlider.slider.value);
            const b = parseInt(bSlider.slider.value);
            const hsl = rgbToHsl(r, g, b);
            currentHue = hsl.h;
            currentSaturation = hsl.s;
            currentLightness = hsl.l;
            updateCurrentColor();
        };
        
        gSlider.slider.oninput = () => {
            const r = parseInt(rSlider.slider.value);
            const g = parseInt(gSlider.slider.value);
            const b = parseInt(bSlider.slider.value);
            const hsl = rgbToHsl(r, g, b);
            currentHue = hsl.h;
            currentSaturation = hsl.s;
            currentLightness = hsl.l;
            updateCurrentColor();
        };
        
        bSlider.slider.oninput = () => {
            const r = parseInt(rSlider.slider.value);
            const g = parseInt(gSlider.slider.value);
            const b = parseInt(bSlider.slider.value);
            const hsl = rgbToHsl(r, g, b);
            currentHue = hsl.h;
            currentSaturation = hsl.s;
            currentLightness = hsl.l;
            updateCurrentColor();
        };
        
        // Event listener para área de seleção de cor
        colorAreaContainer.addEventListener('click', (e) => {
            const rect = colorAreaContainer.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const saturation = Math.round((x / rect.width) * 100);
            const lightness = Math.round(100 - (y / rect.height) * 100);
            
            currentSaturation = Math.max(0, Math.min(100, saturation));
            currentLightness = Math.max(0, Math.min(100, lightness));
            
            updateCurrentColor();
            updateColorIndicator(x, y);
        });
        
        // Função para atualizar posição do indicador
        function updateColorIndicator(x, y) {
            colorIndicator.style.left = x + 'px';
            colorIndicator.style.top = y + 'px';
        }
        
        // Função para atualizar posição do indicador baseada nos valores HSL
        function updateColorIndicatorFromHSL() {
            const rect = colorAreaContainer.getBoundingClientRect();
            const x = (currentSaturation / 100) * rect.width;
            const y = (100 - currentLightness) / 100 * rect.height;
            updateColorIndicator(x, y);
        }
        
        // Event listener para input hex
        hexInput.oninput = () => {
            const hex = hexInput.value;
            if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
                const rgb = hexToRgb(hex);
                if (rgb) {
                    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
                    currentHue = hsl.h;
                    currentSaturation = hsl.s;
                    currentLightness = hsl.l;
                    updateCurrentColor();
                }
            }
        };
        
        // Montar controles
        controlsContainer.appendChild(hexInput);
        
        // Adicionar sliders HSL
        const hslContainer = document.createElement('div');
        hslContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 16px;
        `;
        hslContainer.appendChild(hSlider.container);
        hslContainer.appendChild(sSlider.container);
        hslContainer.appendChild(lSlider.container);
        
        // Adicionar sliders RGB
        const rgbContainer = document.createElement('div');
        rgbContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 16px;
        `;
        rgbContainer.appendChild(rSlider.container);
        rgbContainer.appendChild(gSlider.container);
        rgbContainer.appendChild(bSlider.container);
        
        controlsContainer.appendChild(hslContainer);
        controlsContainer.appendChild(rgbContainer);
        controlsContainer.appendChild(alphaContainer);
        
        // Botões de ação
        const actionButtons = document.createElement('div');
        actionButtons.style.cssText = `
            display: flex;
            gap: 16px;
        `;
        
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancelar';
        cancelBtn.style.cssText = `
            flex: 1;
            padding: 16px 24px;
            background: #f1f5f9;
            color: #64748b;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
        `;
        cancelBtn.onmouseover = () => {
            cancelBtn.style.background = '#e2e8f0';
            cancelBtn.style.borderColor = '#cbd5e1';
            cancelBtn.style.transform = 'translateY(-1px)';
        };
        cancelBtn.onmouseout = () => {
            cancelBtn.style.background = '#f1f5f9';
            cancelBtn.style.borderColor = '#e2e8f0';
            cancelBtn.style.transform = 'translateY(0)';
        };
        cancelBtn.onclick = () => picker.remove();
        
        const applyBtn = document.createElement('button');
        applyBtn.textContent = 'Aplicar Cor';
        applyBtn.style.cssText = `
            flex: 1;
            padding: 16px 24px;
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        `;
        applyBtn.onmouseover = () => {
            applyBtn.style.background = 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)';
            applyBtn.style.transform = 'translateY(-1px)';
            applyBtn.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
        };
        applyBtn.onmouseout = () => {
            applyBtn.style.background = 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
            applyBtn.style.transform = 'translateY(0)';
            applyBtn.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
        };
        
        actionButtons.appendChild(cancelBtn);
        actionButtons.appendChild(applyBtn);
        
        // Montar picker
        pickerContent.appendChild(colorPreview);
        pickerContent.appendChild(colorAreaContainer);
        pickerContent.appendChild(hueSliderContainer);
        pickerContent.appendChild(controlsContainer);
        pickerContent.appendChild(actionButtons);
        picker.appendChild(pickerContent);
        
        // Adicionar ao body
        document.body.appendChild(picker);
        colorPickerInstance = picker;
        
        // Inicializar
        updateCurrentColor();
        updateColorArea();
        
        // Sincronizar sliders na inicialização
        hueSlider.value = currentHue;
        hSlider.slider.value = currentHue;
        
        // Fechar ao clicar fora
        picker.onclick = (e) => {
            if (e.target === picker) {
                picker.remove();
            }
        };
        
        // Fechar com ESC
        const handleKeydown = (e) => {
            if (e.key === 'Escape') {
                picker.remove();
                document.removeEventListener('keydown', handleKeydown);
            }
        };
        document.addEventListener('keydown', handleKeydown);
        
        // Retornar função para aplicar cor
        return (callback) => {
            applyBtn.onclick = () => {
                const hex = hexInput.value;
                const alpha = parseInt(alphaInput.value);
                let finalColor = hex;
                
                // Se for um hex válido, adicionar transparência se necessário
                if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
                    if (alpha < 100) {
                        const alphaHex = Math.round(alpha * 255 / 100).toString(16).padStart(2, '0');
                        finalColor = hex + alphaHex;
                    } else {
                        finalColor = hex + 'FF';
                    }
                }
                
                // Aplicar a cor
                callback(finalColor);
                
                picker.remove();
                document.removeEventListener('keydown', handleKeydown);
            };
        };
    }
    
    function initColorPickers() {
        // Inicializar todos os seletores de cor
        document.querySelectorAll('[data-coloris]').forEach(input => {
            input.addEventListener('click', (e) => {
                e.preventDefault();
                const picker = createColorPicker();
                picker((color) => {
                    input.value = color;
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    
                    // Se for um input de gradiente, atualizar o sistema de gradientes
                    const gradientContainer = input.closest('#gradient-colors-container');
                    if (gradientContainer) {
                        // Encontrar o índice da cor no gradiente
                        const gradientInputs = gradientContainer.querySelectorAll('input[data-coloris]');
                        const inputIndex = Array.from(gradientInputs).indexOf(input);
                        if (inputIndex !== -1) {
                            // Atualizar a cor no array de gradientes
                            gradientColors[inputIndex] = color;
                            // Aplicar estilos para atualizar o gradiente
                            applyStyles();
                        }
                    }
                });
            });
        });
    }
    
    // Inicializar sistema de cores customizado
    initColorPickers();
    
    // --- ELEMENTOS DO DOM ---
    const textInput = document.getElementById('text-input');
    const animatedText = document.getElementById('animated-text');
    const captureArea = document.getElementById('capture-area');
    const captureViewport = document.getElementById('capture-viewport');
    const transformBox = document.getElementById('transform-box');
    const downloadBtn = document.getElementById('download-btn');
    
    // Modais
    const settingsModalContainer = document.getElementById('settings-modal-container');
    const settingsModalTitle = document.getElementById('settings-modal-title');
    const settingsModalContentHost = document.getElementById('settings-modal-content-host');
    const settingsBtns = document.querySelectorAll('.settings-btn');
    const modalContents = {
        'text-settings-modal': { title: 'Personalizar Texto', content: document.getElementById('text-settings-modal-content') },
        'size-settings-modal': { title: 'Tamanho Personalizado', content: document.getElementById('size-settings-modal-content') },
        'background-settings-modal': { title: 'Personalizar Fundo', content: document.getElementById('background-settings-modal-content') },
        'animation-settings-modal': { title: 'Personalizar Animação', content: document.getElementById('animation-settings-modal-content') }
    };
    const imageModal = document.getElementById('image-modal');
    
    // --- ESTADO DA APLICAÇÃO ---
    let transformState = { x: 0, y: 0, scale: 1, rotation: 0 };
    let activeHandle = null;
    let startMousePos = { x: 0, y: 0 };
    let startTransform = { ...transformState };
    let gradientColors = ['#3b82f6ff', '#9333eaff'];
    
    // Sistema de snap
    const SNAP_THRESHOLD = 10; // pixels de tolerância para snap
    let isSnapping = false;
    
    // Sistema de progresso
    let progressInterval = null;
    let currentProgress = 0;
    const progressMessages = [
        { progress: 0, message: "Preparando..." },
        { progress: 15, message: "Fazendo capturas de movimentos..." },
        { progress: 40, message: "Tornando a animação fluida..." },
        { progress: 70, message: "Finalizando exportação..." },
        { progress: 90, message: "Quase pronto..." },
        { progress: 100, message: "Concluído!" }
    ];
    const MAX_GRADIENT_COLORS = 5;

    const keyframeStyles = {
        // Animações básicas originais
        bounce: { '0%': 'transform: translateY(-25%);', '100%': 'transform: translateY(0);' },
        flip: { '0%': 'transform: perspective(400px) rotate3d(1, 0, 0, 90deg); opacity: 0;', '100%': 'transform: perspective(400px) rotate3d(1, 0, 0, 0deg); opacity: 1;' },
        fadeIn: { '0%': 'opacity: 0;', '100%': 'opacity: 1;' },
        slideUp: { '0%': 'transform: translateY(100%); opacity: 0;', '100%': 'transform: translateY(0); opacity: 1;' },
        pulse: { '0%': 'transform: scale3d(1, 1, 1);', '50%': 'transform: scale3d(1.1, 1.1, 1.1);', '100%': 'transform: scale3d(1, 1, 1);' },
        tada: { '0%': 'transform: scale3d(1, 1, 1);', '10%': 'transform: scale3d(0.9, 0.9, 0.9) rotate3d(0, 0, 1, -3deg);', '30%': 'transform: scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, 3deg);', '50%': 'transform: scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, 3deg);', '100%': 'transform: scale3d(1, 1, 1);' },
        
        // Novas animações de Zoom
        zoomIn: { '0%': 'transform: scale3d(0.3, 0.3, 0.3); opacity: 0;', '50%': 'opacity: 1;', '100%': 'transform: scale3d(1, 1, 1);' },
        zoomOut: { '0%': 'transform: scale3d(1, 1, 1);', '50%': 'opacity: 1;', '100%': 'transform: scale3d(0.3, 0.3, 0.3); opacity: 0;' },
        
        // Novas animações de Slide
        slideDown: { '0%': 'transform: translateY(-100%); opacity: 0;', '100%': 'transform: translateY(0); opacity: 1;' },
        slideLeft: { '0%': 'transform: translateX(100%); opacity: 0;', '100%': 'transform: translateX(0); opacity: 1;' },
        slideRight: { '0%': 'transform: translateX(-100%); opacity: 0;', '100%': 'transform: translateX(0); opacity: 1;' },
        
        // Novas animações de Rotação
        rotateIn: { '0%': 'transform: rotate(-200deg); opacity: 0;', '100%': 'transform: rotate(0deg); opacity: 1;' },
        rotateOut: { '0%': 'transform: rotate(0deg); opacity: 1;', '100%': 'transform: rotate(200deg); opacity: 0;' },
        
        // Animações de Efeito (mantendo apenas as que funcionam bem)
        shake: { '0%, 100%': 'transform: translateX(0);', '10%, 30%, 50%, 70%, 90%': 'transform: translateX(-10px);', '20%, 40%, 60%, 80%': 'transform: translateX(10px);' },
        wobble: { '0%': 'transform: translateX(0%);', '15%': 'transform: translateX(-25%) rotate(-5deg);', '30%': 'transform: translateX(20%) rotate(3deg);', '45%': 'transform: translateX(-15%) rotate(-3deg);', '60%': 'transform: translateX(10%) rotate(2deg);', '75%': 'transform: translateX(-5%) rotate(-1deg);', '100%': 'transform: translateX(0%);' },
        heartbeat: { '0%': 'transform: scale(1);', '14%': 'transform: scale(1.3);', '28%': 'transform: scale(1);', '42%': 'transform: scale(1.3);', '70%': 'transform: scale(1);' },
        rubberBand: { '0%': 'transform: scale(1);', '30%': 'transform: scaleX(1.25) scaleY(0.75);', '40%': 'transform: scaleX(0.75) scaleY(1.25);', '50%': 'transform: scaleX(1.15) scaleY(0.85);', '65%': 'transform: scaleX(0.95) scaleY(1.05);', '75%': 'transform: scaleX(1.05) scaleY(0.95);', '100%': 'transform: scale(1);' },
        swing: { '20%': 'transform: rotate3d(0, 0, 1, 15deg);', '40%': 'transform: rotate3d(0, 0, 1, -10deg);', '60%': 'transform: rotate3d(0, 0, 1, 5deg);', '80%': 'transform: rotate3d(0, 0, 1, -5deg);', '100%': 'transform: rotate3d(0, 0, 1, 0deg);' },
        
        // Animações que estavam faltando
        jello: { '0%, 11.1%, 100%': 'transform: translate3d(0, 0, 0);', '22.2%': 'transform: skewX(-12.5deg) skewY(-12.5deg);', '33.3%': 'transform: skewX(6.25deg) skewY(6.25deg);', '44.4%': 'transform: skewX(-3.125deg) skewY(-3.125deg);', '55.5%': 'transform: skewX(1.5625deg) skewY(1.5625deg);', '66.6%': 'transform: skewX(-0.78125deg) skewY(-0.78125deg);', '77.7%': 'transform: skewX(0.390625deg) skewY(0.390625deg);', '88.8%': 'transform: skewX(-0.1953125deg) skewY(-0.1953125deg);' },
        hinge: { '0%': 'transform-origin: top left; animation-timing-function: ease-in-out;', '20%, 60%': 'transform: rotate3d(0, 0, 1, 80deg); transform-origin: top left; animation-timing-function: ease-in-out;', '40%, 80%': 'transform: rotate3d(0, 0, 1, 60deg); transform-origin: top left; animation-timing-function: ease-in-out; opacity: 1;', '100%': 'transform: translate3d(0, 700px, 0); opacity: 0;' },
        jackInTheBox: { '0%': 'opacity: 0; transform: scale(0.1) rotate(30deg); transform-origin: center bottom;', '50%': 'transform: rotate(-10deg);', '70%': 'transform: rotate(3deg);', '100%': 'opacity: 1; transform: scale(1) rotate(0deg);' },
        rollIn: { '0%': 'opacity: 0; transform: translate3d(-100%, 0, 0) rotate3d(0, 0, 1, -120deg);', '100%': 'opacity: 1; transform: translate3d(0, 0, 0);' },
        rollOut: { '0%': 'opacity: 1;', '100%': 'opacity: 0; transform: translate3d(100%, 0, 0) rotate3d(0, 0, 1, 120deg);' },
        lightSpeedIn: { '0%': 'transform: translate3d(100%, 0, 0) skewX(-30deg); opacity: 0;', '60%': 'transform: skewX(20deg); opacity: 1;', '80%': 'transform: skewX(-5deg); opacity: 1;', '100%': 'transform: translate3d(0, 0, 0); opacity: 1;' },
        lightSpeedOut: { '0%': 'opacity: 1;', '100%': 'transform: translate3d(100%, 0, 0) skewX(30deg); opacity: 0;' }
    };

    // --- FUNÇÕES PRINCIPAIS ---

    // Aplica apenas estilos que não reiniciam a animação.
    function applyStyles(targetCaptureArea = captureArea, targetAnimatedText = animatedText) {
        // Seletores de estilo (lendo do DOM principal)
        const fontFamilySelect = document.getElementById('font-family-select');
        const textColorInput = document.getElementById('text-color-input');
        const textStrokeWidthInput = document.getElementById('text-stroke-width');
        const textStrokeColorInput = document.getElementById('text-stroke-color');
        const textGlowBlurInput = document.getElementById('text-glow-blur');
        const textGlowColorInput = document.getElementById('text-glow-color');
        const bgColorSolidInput = document.getElementById('bg-color-solid');
        const gradientDirectionSelect = document.getElementById('gradient-direction-select');
        // Removido: animateGradientToggle
        const widthInput = document.getElementById('width-input');
        const heightInput = document.getElementById('height-input');

        // Aplicar estilos de texto ao alvo
        // Só define o textContent se não estiver em modo individual
        if (!targetAnimatedText.classList.contains('individual')) {
            targetAnimatedText.textContent = textInput.value || 'AllGen Rocks!';
        }
        targetAnimatedText.style.fontFamily = fontFamilySelect.value;
        targetAnimatedText.style.color = textColorInput.value;
        const glowBlur = textGlowBlurInput.value;
        const glowColor = textGlowColorInput.value;
        const strokeWidth = parseFloat(textStrokeWidthInput.value);
        const strokeColor = textStrokeColorInput.value;
        let textShadows = [];
        if (strokeWidth > 0) {
             for (let x = -strokeWidth; x <= strokeWidth; x += 1) {
                 for (let y = -strokeWidth; y <= strokeWidth; y += 1) {
                     if (Math.hypot(x, y) <= strokeWidth) {
                         textShadows.push(`${x}px ${y}px 0 ${strokeColor}`);
                     }
                 }
             }
        }
        if (glowBlur > 0) textShadows.push(`0 0 ${glowBlur}px ${glowColor}`);
        targetAnimatedText.style.textShadow = textShadows.join(', ');
        
        // Aplicar estilos de fundo ao alvo
        const bgType = document.querySelector('input[name="bg-type"]:checked').value;
        if (bgType === 'solid') {
            targetCaptureArea.style.background = bgColorSolidInput.value;
            targetCaptureArea.style.backgroundSize = 'cover';
            targetCaptureArea.style.backgroundPosition = 'center';
            targetCaptureArea.style.backgroundRepeat = 'no-repeat';
        } else if (bgType === 'gradient') {
            const direction = gradientDirectionSelect.value;
            targetCaptureArea.style.background = `linear-gradient(${direction}, ${gradientColors.join(', ')})`;
            targetCaptureArea.style.backgroundSize = 'cover';
            targetCaptureArea.style.backgroundPosition = 'center';
            targetCaptureArea.style.backgroundRepeat = 'no-repeat';
        }
        // Remover animação de gradiente (função removida)
        
        // Aplicar tamanho original (sem redimensionamento inteligente por enquanto)
        const originalWidth = parseInt(widthInput.value, 10);
        const originalHeight = parseInt(heightInput.value, 10);
        
        // Aplicar dimensões originais
        targetCaptureArea.style.width = `${originalWidth}px`;
        targetCaptureArea.style.height = `${originalHeight}px`;
        
        // Centralizar e ajustar texto automaticamente
        if (targetCaptureArea === captureArea) {
            // SEMPRE centralizar ao mudar resolução - resetar tudo
            transformState.x = 0;
            transformState.y = 0;
            transformState.scale = 1;
            transformState.rotation = 0;
            
            // Aplicar transformação imediatamente
            applyTransform();
            
            // Esconder linhas guia ao redimensionar
            const snapGuideH = document.getElementById('snap-guide-h');
            const snapGuideV = document.getElementById('snap-guide-v');
            if (snapGuideH) snapGuideH.classList.remove('active');
            if (snapGuideV) snapGuideV.classList.remove('active');
            
            // Manter tamanho de fonte padrão
            targetAnimatedText.style.fontSize = '96px';
        }
        
        // Atualizar inputs com valores originais
        widthInput.value = originalWidth;
        heightInput.value = originalHeight;
        if (targetCaptureArea === captureArea) {
            updateViewportScale();
        }
    }

    // Reconstrói a estrutura do texto e a animação.
    function rebuildAnimation(targetAnimatedText = animatedText, targetCaptureArea = captureArea, isForCapture = false) {
        // Ler valores do DOM principal
        const text = textInput.value;
        const animationName = document.getElementById('animation-select').value;
        const animationMode = document.getElementById('animation-mode-select').value;
        const actionDuration = parseFloat(document.getElementById('animation-action-duration-input').value);
        const staticDuration = parseFloat(document.getElementById('animation-static-duration-input').value);

        if (isNaN(actionDuration) || isNaN(staticDuration)) return;

        // Oculta o container para evitar piscar/transições indesejadas durante a reconstrução.
        targetAnimatedText.style.visibility = 'hidden';

        // Recriar os keyframes
        const totalDuration = actionDuration + staticDuration;
        const actionPercentage = totalDuration > 0 ? (actionDuration / totalDuration) * 50 : 0;
        const masterAnimationName = `master-${animationName}`;
        const selectedKeyframes = keyframeStyles[animationName];
        let keyframesCSS = `@keyframes ${masterAnimationName} {`;
        const initialState = selectedKeyframes['0%'];
        const finalState = selectedKeyframes['100%'];
        for (const key in selectedKeyframes) { keyframesCSS += `${(parseFloat(key)*(actionPercentage/100)).toFixed(2)}% { ${selectedKeyframes[key]} }`; }
        keyframesCSS += `${actionPercentage.toFixed(2)}%, ${(100 - actionPercentage).toFixed(2)}% { ${finalState} }`;
        for (const key in selectedKeyframes) { const percentage = parseFloat(key); const scaledPercentage = 100 - (percentage * (actionPercentage/100)); const stateKey = Object.keys(selectedKeyframes).reverse().find(k => parseFloat(k) === percentage); keyframesCSS += `${scaledPercentage.toFixed(2)}% { ${selectedKeyframes[stateKey]} }`; }
        keyframesCSS += `100% { ${initialState} } }`;
        let styleTag = document.getElementById('dynamic-keyframes');
        if (!styleTag) { styleTag = document.createElement('style'); styleTag.id = 'dynamic-keyframes'; document.head.appendChild(styleTag); }
        styleTag.innerHTML = keyframesCSS;

        // Limpa o conteúdo e as classes.
        targetAnimatedText.innerHTML = '';
        targetAnimatedText.className = 'text-center px-4 whitespace-nowrap';
        targetAnimatedText.style.animation = ''; // Limpa a animação do container principal
        
        const totalCycleDuration = totalDuration * 2;
        const animationProps = `${masterAnimationName} ${totalCycleDuration}s infinite`;
        
        if (animationMode === 'individual') {
            targetAnimatedText.classList.add('individual');
            text.split('').forEach((char, index) => {
                const span = document.createElement('span');
                span.innerHTML = char === ' ' ? '&nbsp;' : char;
                span.style.animation = animationProps;
                span.style.animationFillMode = 'backwards'; // Aplica estado inicial antes do delay
                const initialDelay = index * 0.1;
                span.dataset.initialDelay = initialDelay;
                span.style.animationDelay = `${initialDelay}s`;
                targetAnimatedText.appendChild(span);
            });
        } else {
            targetAnimatedText.innerText = text;
            targetAnimatedText.style.animation = animationProps;
            targetAnimatedText.style.animationFillMode = 'backwards'; // Aplica estado inicial
            targetAnimatedText.dataset.initialDelay = '0';
        }
        
        // Aplicar estilos APÓS criar os spans para não interferir
        applyStyles(targetCaptureArea, targetAnimatedText);

        // Força o navegador a processar as mudanças e reexibe o elemento.
        if (isForCapture) {
            // Para a captura do GIF, removemos a assincronicidade.
            // Forçamos o reflow para garantir que os estilos sejam aplicados.
            void targetAnimatedText.offsetWidth;
            
            // Garante que todas as animações estejam no estado inicial
            const allAnimatedElements = targetAnimatedText.classList.contains('individual')
                ? Array.from(targetAnimatedText.querySelectorAll('span'))
                : [targetAnimatedText];
            
            allAnimatedElements.forEach(el => {
                el.style.animationPlayState = 'paused';
                el.style.animationDelay = el.dataset.initialDelay ? `${el.dataset.initialDelay}s` : '0s';
                // Para animação individual, garante que o estado inicial seja visível
                if (targetAnimatedText.classList.contains('individual')) {
                    el.style.animationFillMode = 'backwards';
                }
            });
            
            targetAnimatedText.style.visibility = 'visible';
        } else {
            // Para a visualização ao vivo, o setTimeout ainda oferece a melhor experiência visual.
            setTimeout(() => {
                targetAnimatedText.style.visibility = 'visible';
            }, 0);
        }
    }
    
    async function generateGif() {
        // Iniciar sistema de progresso
        startProgress();

        // 1. Obter dimensões originais (não escaladas) para o GIF
        const widthInput = document.getElementById('width-input');
        const heightInput = document.getElementById('height-input');
        
        // Restaurar valores originais dos botões de preset
        const activePreset = document.querySelector('.size-preset.active');
        const finalWidth = activePreset ? parseInt(activePreset.dataset.width, 10) : parseInt(widthInput.value, 10);
        const finalHeight = activePreset ? parseInt(activePreset.dataset.height, 10) : parseInt(heightInput.value, 10);
        
        // 2. Criar e posicionar o clone fora da tela
        const clone = captureArea.cloneNode(true);
        
        // Configurar clone com dimensões exatas do GIF
        clone.style.position = 'absolute';
        clone.style.left = '-9999px';
        clone.style.top = '0px';
        clone.style.width = finalWidth + 'px';
        clone.style.height = finalHeight + 'px';
        clone.style.transform = 'scale(1)';
        clone.style.display = 'flex';
        clone.style.alignItems = 'center';
        clone.style.justifyContent = 'center';
        clone.style.backgroundSize = 'cover';
        clone.style.backgroundPosition = 'center';
        clone.style.backgroundRepeat = 'no-repeat';
        
        document.body.appendChild(clone);
        
        const cloneAnimatedText = clone.querySelector('#animated-text');
        clone.querySelectorAll('.transform-handle').forEach(h => h.style.opacity = '0');
        
        // Preservar a estrutura de posicionamento do transformBox
        const cloneTransformBox = clone.querySelector('#transform-box');
        
        // Variáveis de offset para cada tipo de animação (ajuste manual)
        const animationOffsets = {
            'bounce': { x: 0, y: 0 },
            'flip': { x: 0, y: -25 }, // 15% para cima
            'fadeIn': { x: 0, y: 0 },
            'slideUp': { x: 0, y: 0 },
            'pulse': { x: 0, y: 0 },
            'tada': { x: 0, y: 0 }
        };
        
        // Obter o tipo de animação atual
        const currentAnimation = document.getElementById('animation-select').value;
        const offset = animationOffsets[currentAnimation] || { x: 0, y: 0 };
        
        // Aplicar as mesmas transformações do transformBox original + offset da animação
        const offsetX = (offset.x / 100) * finalWidth;
        const offsetY = (offset.y / 100) * finalHeight;
        
        cloneTransformBox.style.transform = `translate(-50%, -50%) translate(${transformState.x + offsetX}px, ${transformState.y + offsetY}px) scale(${transformState.scale}) rotate(${transformState.rotation}deg)`;
        cloneTransformBox.style.transformOrigin = 'center';
        cloneTransformBox.style.position = 'absolute';
        cloneTransformBox.style.top = '50%';
        cloneTransformBox.style.left = '50%';
        
        // Preservar propriedades 3D apenas no container
        clone.style.transformStyle = 'preserve-3d';
        clone.style.perspective = '400px';
        
        // Garantir que o background do clone seja aplicado corretamente
        const bgType = document.querySelector('input[name="bg-type"]:checked').value;
        if (bgType === 'solid') {
            const bgColor = document.getElementById('bg-color-solid').value;
            clone.style.background = bgColor;
        } else if (bgType === 'gradient') {
            const direction = document.getElementById('gradient-direction-select').value;
            clone.style.background = `linear-gradient(${direction}, ${gradientColors.join(', ')})`;
        }

        // 2. Primeira reconstrução da animação no clone
        rebuildAnimation(cloneAnimatedText, clone, true);
        
        // Atualizar progresso - preparação concluída
        currentProgress = 20;
        updateProgress();

        try {
            const workerScriptContent = await fetch('https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js').then(res => res.text());
            const workerBlob = new Blob([workerScriptContent], { type: 'application/javascript' });
            const workerUrl = URL.createObjectURL(workerBlob);

            // --- CÁLCULOS DE TEMPO ---
            const actionDurationSec = parseFloat(document.getElementById('animation-action-duration-input').value);
            const staticDurationSec = parseFloat(document.getElementById('animation-static-duration-input').value);
            const animationMode = document.getElementById('animation-mode-select').value;
            const text = textInput.value;

            // Cálculo para UM CICLO APENAS (descida + pausa + subida):
            // - Duração da descida: actionDurationSec
            // - Tempo estático: staticDurationSec
            // - Duração da subida: actionDurationSec
            // - UM CICLO = descida + pausa + subida
            const singleCycleDurationMs = (actionDurationSec + staticDurationSec + actionDurationSec) * 1000;
            
            let maxInitialStaggerDelayMs = 0;
            if (animationMode === 'individual' && text.length > 1) {
                maxInitialStaggerDelayMs = (text.length - 1) * 0.1 * 1000;
            }
            
            // Duração total = delay máximo + UM CICLO APENAS (sem repetir)
            // Para modo individual, garante que todas as letras terminem a saída
            const totalCaptureDurationMs = maxInitialStaggerDelayMs + singleCycleDurationMs;
            
            const TARGET_FPS = 30;
            const frameDelayMs = 1000 / TARGET_FPS;
            // Captura apenas o ciclo completo
            const framesToCapture = Math.ceil(totalCaptureDurationMs / frameDelayMs);
            
            // Atualizar progresso - configuração concluída
            currentProgress = 30;
            updateProgress();

            const gif = new GIF({
                workers: 4,
                quality: 10,
                width: finalWidth,
                height: finalHeight,
                workerScript: workerUrl
            });
        
            // --- INÍCIO DA CORREÇÃO ---

            // 3. RESET E PAUSA IMEDIATA: Reconstrói a animação e pausa imediatamente sem ciclo de aquecimento
            rebuildAnimation(cloneAnimatedText, clone, true);

            const animatedElements = clone.querySelector('#animated-text').classList.contains('individual')
                ? Array.from(clone.querySelectorAll('#animated-text span'))
                : [clone.querySelector('#animated-text')];

            // Armazena a animação original e pausa todas as animações
            animatedElements.forEach(el => {
                el.dataset.originalAnimation = el.style.animation;
                el.style.animationPlayState = 'paused';
            });
            
            // Espera o próximo frame de renderização para garantir que o 'paused' foi aplicado
            await new Promise(resolve => requestAnimationFrame(resolve));

            // Aguarda um frame adicional para garantir que a pausa foi totalmente aplicada
            await new Promise(resolve => requestAnimationFrame(resolve));

            // 5. LOOP DE CAPTURA CONTROLADA - ABORDAGEM SIMPLIFICADA
            console.log(`Iniciando captura de ${framesToCapture} frames`);
            for (let i = 0; i < framesToCapture; i++) {
                const currentTimeMs = i * frameDelayMs;
                console.log(`Processando frame ${i + 1}/${framesToCapture}, tempo: ${currentTimeMs}ms`);
                
                // Atualizar progresso durante captura (30% a 80%)
                const captureProgress = 30 + (i / framesToCapture) * 50;
                currentProgress = Math.min(captureProgress, 80);
                updateProgress();

                // Aplica o timing correto para todas as animações
                animatedElements.forEach(el => {
                    const initialDelaySec = parseFloat(el.dataset.initialDelay || '0');
                    const currentTimeSec = currentTimeMs / 1000;
                    
                    if (currentTimeSec >= initialDelaySec) {
                        // A animação já deveria ter começado
                        const entryDuration = actionDurationSec; // duração da descida
                        const staticDuration = staticDurationSec; // duração da pausa
                        const exitDuration = actionDurationSec; // duração da subida
                        const totalCycleDuration = entryDuration + staticDuration + exitDuration;
                        
                        let elapsedInCycle = (currentTimeSec - initialDelaySec);
                        
                        // Para modo individual, calcula o timing correto das 3 fases
                        if (animationMode === 'individual') {
                            // Fase 1: Descida (0 até entryDuration)
                            // Fase 2: Pausa (entryDuration até entryDuration + staticDuration)
                            // Fase 3: Subida (entryDuration + staticDuration até totalCycleDuration)
                            
                            let animationTime = 0;
                            if (elapsedInCycle <= entryDuration) {
                                // Fase 1: Descida
                                animationTime = elapsedInCycle;
                            } else if (elapsedInCycle <= entryDuration + staticDuration) {
                                // Fase 2: Pausa (mantém no estado final da descida)
                                animationTime = entryDuration;
                            } else if (elapsedInCycle <= totalCycleDuration) {
                                // Fase 3: Subida (inverte a animação)
                                const exitProgress = (elapsedInCycle - entryDuration - staticDuration) / exitDuration;
                                animationTime = entryDuration - (exitProgress * entryDuration);
                            } else {
                                // Após o ciclo completo, mantém no estado inicial
                                animationTime = 0;
                            }
                            
                            elapsedInCycle = animationTime;
                        } else {
                            // Para modo normal, usa o cálculo anterior
                            const cycleDuration = actionDurationSec * 2 + staticDurationSec;
                            elapsedInCycle = (currentTimeSec - initialDelaySec) % cycleDuration;
                        }
                        
                        // Debug: mostra o progresso da animação
                        if (i % 10 === 0) { // A cada 10 frames
                            const progress = elapsedInCycle / totalCycleDuration;
                            let phase = 'ENTRADA';
                            if (elapsedInCycle <= entryDuration) {
                                phase = 'DESCIDA';
                            } else if (elapsedInCycle <= entryDuration + staticDuration) {
                                phase = 'PAUSA';
                            } else {
                                phase = 'SUBIDA';
                            }
                            
                            console.log(`Frame ${i}: ${phase} - Tempo ${elapsedInCycle.toFixed(2)}s (Descida: ${entryDuration}s, Pausa: ${staticDuration}s, Subida: ${exitDuration}s)`);
                        }
                        
                        // Aplica o delay negativo para posicionar a animação no tempo correto
                        el.style.animationDelay = `-${elapsedInCycle}s`;
                        el.style.animationFillMode = 'both';
                        el.style.animationPlayState = 'paused';
                    } else {
                        // A animação ainda não começou
                        el.style.animationDelay = `${initialDelaySec}s`;
                        el.style.animationFillMode = 'backwards';
                        el.style.animationPlayState = 'paused';
                    }
                });
                
                // Espera o próximo frame para que o navegador aplique o novo delay
                await new Promise(resolve => requestAnimationFrame(resolve));
                
                // Aguarda um frame adicional para garantir estabilidade
                await new Promise(resolve => requestAnimationFrame(resolve));
                
                // Agora, com a animação congelada no ponto certo, captura o canvas
                const canvas = await html2canvas(clone, {
                    width: finalWidth,
                    height: finalHeight,
                    scale: 1,
                    logging: false,
                    useCORS: true,
                    backgroundColor: '#ffffff', // Fundo branco para evitar área preta
                    allowTaint: true,
                    x: 0,
                    y: 0,
                    scrollX: 0,
                    scrollY: 0,
                    foreignObjectRendering: false,
                    removeContainer: false,
                    imageTimeout: 0,
                    onclone: (clonedDoc) => {
                        // Garantir que o clone tenha o background correto
                        const clonedCaptureArea = clonedDoc.querySelector('#capture-area');
                        if (clonedCaptureArea) {
                            clonedCaptureArea.style.backgroundSize = 'cover';
                            clonedCaptureArea.style.backgroundPosition = 'center';
                            clonedCaptureArea.style.backgroundRepeat = 'no-repeat';
                        }
                    }
                });
                
                // Debug: verificar se o canvas foi criado corretamente
                if (canvas.width === 0 || canvas.height === 0) {
                    console.error('Canvas inválido:', canvas.width, 'x', canvas.height);
                } else {
                    console.log(`Canvas capturado: ${canvas.width}x${canvas.height}`);
                }
                gif.addFrame(canvas, { delay: frameDelayMs, copy: true });
                console.log(`Frame ${i + 1} capturado e adicionado ao GIF`);
            }
            // --- FIM DA CORREÇÃO ---

            
            // Atualizar progresso - finalização
            currentProgress = 85;
            updateProgress();
            
            gif.render();

            gif.on('finished', blob => {
                // Atualizar progresso - concluído
                currentProgress = 100;
                updateProgress();
                
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'allgen-gif-animado.gif';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                

                document.body.removeChild(clone);
                
                // Parar progresso e resetar botão
                stopProgress();
                URL.revokeObjectURL(workerUrl);
            });

        } catch (error) {
            console.error("Erro ao gerar GIF:", error);
            
            // Parar progresso em caso de erro
            stopProgress();
            
            if (document.body.contains(clone)) {
                document.body.removeChild(clone);
            }
        }
    }

    // --- LÓGICA DOS MODAIS E CONTROLES DINÂMICOS ---
    function openSettingsModal(modalId) {
        const modalData = modalContents[modalId];
        settingsModalTitle.innerText = modalData.title;
        const contentNode = modalData.content.cloneNode(true);
        settingsModalContentHost.innerHTML = ''; // Limpa o container
        settingsModalContentHost.appendChild(contentNode);
        
        if (modalId === 'background-settings-modal') {
            renderGradientControls();
            const bgType = document.querySelector('input[name="bg-type"]:checked').value;
            settingsModalContentHost.querySelector('#bg-solid-controls').classList.toggle('hidden', bgType !== 'solid');
            settingsModalContentHost.querySelector('#bg-gradient-controls').classList.toggle('hidden', bgType !== 'gradient');
            settingsModalContentHost.querySelector('#bg-image-controls').classList.toggle('hidden', bgType !== 'image');
        }
        
        settingsModalContainer.classList.remove('hidden');
        setupDynamicListeners();
    }

    function closeSettingsModal() {
        const currentContentNode = settingsModalContentHost.querySelector(':first-child');
        const title = settingsModalTitle.innerText;
        if (title === 'Personalizar Texto') modalContents['text-settings-modal'].content = currentContentNode;
        else if (title === 'Tamanho Personalizado') modalContents['size-settings-modal'].content = currentContentNode;
        else if (title === 'Personalizar Fundo') modalContents['background-settings-modal'].content = currentContentNode;
        else if (title === 'Personalizar Animação') modalContents['animation-settings-modal'].content = currentContentNode;
        settingsModalContainer.classList.add('hidden');
    }

    function setupDynamicListeners() {
         // Controles que mudam apenas estilos
        const styleInputs = settingsModalContentHost.querySelectorAll(
            `#font-family-select, #text-color-input, #text-stroke-width, #text-stroke-color, 
             #text-glow-blur, #text-glow-color, #bg-color-solid, #gradient-direction-select, 
             #width-input, #height-input`
        );
        styleInputs.forEach(el => {
            el.addEventListener('input', () => applyStyles());
            el.addEventListener('change', () => applyStyles());
        });

        // Listener para o input de texto principal
        textInput.addEventListener('input', () => applyStyles());

        // Controles que reiniciam a animação
        const animationInputs = settingsModalContentHost.querySelectorAll(
            '#animation-action-duration-input, #animation-static-duration-input'
        );
        animationInputs.forEach(el => {
            el.addEventListener('input', () => rebuildAnimation());
            el.addEventListener('change', () => rebuildAnimation());
        });

        const openImageBtn = document.getElementById('open-image-modal-btn');
        if (openImageBtn) openImageBtn.addEventListener('click', () => imageModal.classList.remove('hidden'));
        const addGradientColorBtn = document.getElementById('add-gradient-color-btn');
        if (addGradientColorBtn) addGradientColorBtn.addEventListener('click', addGradientColorStop);
        
        // Reinicializar sistema de cores para novos elementos
        initColorPickers();
    }
    
    function renderGradientControls() {
        const container = document.getElementById('gradient-colors-container');
        if (!container) return;
        container.innerHTML = '';
        gradientColors.forEach((color, index) => {
            const div = document.createElement('div');
            div.className = 'flex items-center space-x-2';
            div.innerHTML = `<input type="text" value="${color}" data-coloris class="flex-grow">
                             <button data-index="${index}" class="remove-gradient-color-btn p-1 rounded hover:bg-red-100 text-red-500 ${gradientColors.length <= 2 ? 'hidden' : ''}">&times;</button>`;
            container.appendChild(div);
            div.querySelector('input').addEventListener('coloris:pick', e => {
                gradientColors[index] = e.detail.color;
                applyStyles(); // Apenas atualiza o estilo do gradiente
            });
        });
        const removeBtns = container.querySelectorAll('.remove-gradient-color-btn');
        removeBtns.forEach(btn => btn.addEventListener('click', removeGradientColorStop));
        document.getElementById('add-gradient-color-btn').style.display = gradientColors.length < MAX_GRADIENT_COLORS ? 'block' : 'none';
        
        // Reinicializar sistema de cores para os novos inputs
        initColorPickers();
    }

    function addGradientColorStop() {
        if (gradientColors.length < MAX_GRADIENT_COLORS) {
            gradientColors.push('#ffffffff');
            renderGradientControls();
            setupDynamicListeners();
            applyStyles();
        }
    }

    function removeGradientColorStop(e) {
        const index = parseInt(e.target.dataset.index, 10);
        if (gradientColors.length > 2) {
            gradientColors.splice(index, 1);
            renderGradientControls();
            setupDynamicListeners();
            applyStyles();
        }
    }

    function updateViewportScale() {
        const viewportWidth = captureViewport.offsetWidth;
        const widthInput = document.getElementById('width-input');
        const captureWidth = widthInput ? parseInt(widthInput.value, 10) : parseInt(modalContents['size-settings-modal'].content.querySelector('#width-input').value, 10);
        if (!viewportWidth || !captureWidth) return;
        const scale = viewportWidth / captureWidth;
        captureArea.style.transform = `scale(${scale})`;
        captureViewport.style.height = `${captureArea.offsetHeight * scale}px`;
    }

    function applyTransform() {
        transformBox.style.transform = `translate(-50%, -50%) translate(${transformState.x}px, ${transformState.y}px) scale(${transformState.scale}) rotate(${transformState.rotation}deg)`;
    }
    
    // Sistema de snap
    function checkSnap() {
        // Não aplicar snap se não estivermos arrastando
        if (!activeHandle || activeHandle !== 'drag') return;
        
        const snapGuideH = document.getElementById('snap-guide-h');
        const snapGuideV = document.getElementById('snap-guide-v');
        
        // Resetar guias
        snapGuideH.classList.remove('active');
        snapGuideV.classList.remove('active');
        isSnapping = false;
        
        // Verificar snap horizontal (Y)
        const distanceFromCenterY = Math.abs(transformState.y);
        if (distanceFromCenterY <= SNAP_THRESHOLD) {
            transformState.y = 0;
            snapGuideH.classList.add('active');
            isSnapping = true;
        }
        
        // Verificar snap vertical (X)
        const distanceFromCenterX = Math.abs(transformState.x);
        if (distanceFromCenterX <= SNAP_THRESHOLD) {
            transformState.x = 0;
            snapGuideV.classList.add('active');
            isSnapping = true;
        }
        
        applyTransform();
    }
    
    // Atualizar display de rotação
    function updateRotationDisplay() {
        const rotationDisplay = document.getElementById('rotation-display');
        const roundedRotation = Math.round(transformState.rotation);
        rotationDisplay.textContent = `${roundedRotation}°`;
        rotationDisplay.classList.add('active');
        
        // Limpar timeout anterior se existir
        if (window.rotationDisplayTimeout) {
            clearTimeout(window.rotationDisplayTimeout);
        }
        
        // Esconder após 4 segundos
        window.rotationDisplayTimeout = setTimeout(() => {
            rotationDisplay.classList.remove('active');
        }, 4000);
    }

    function onMouseDown(e) {
        e.preventDefault();
        activeHandle = e.target.dataset.handle ? e.target : (e.target === transformBox || animatedText.contains(e.target)) ? 'drag' : null;
        if (!activeHandle) return;
        transformBox.classList.add('active');
        startMousePos = { x: e.clientX, y: e.clientY };
        startTransform = { ...transformState };
        const boxRect = transformBox.getBoundingClientRect();
        startTransform.boxCenterX = boxRect.left + boxRect.width / 2;
        startTransform.boxCenterY = boxRect.top + boxRect.height / 2;
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }

    function onMouseMove(e) {
        if (!activeHandle) return;
        const dx = e.clientX - startMousePos.x;
        const dy = e.clientY - startMousePos.y;
        const handleType = typeof activeHandle === 'string' ? activeHandle : activeHandle.dataset.handle;
        
        if (handleType === 'drag') {
            transformState.x = startTransform.x + dx;
            transformState.y = startTransform.y + dy;
            checkSnap(); // Aplicar snap ao arrastar
        } else if (handleType === 'rot') {
            const angle = Math.atan2(e.clientY - startTransform.boxCenterY, e.clientX - startTransform.boxCenterX) * (180 / Math.PI);
            // Rotação precisa de 1° em 1°
            const preciseAngle = Math.round(angle + 90);
            transformState.rotation = preciseAngle;
            updateRotationDisplay(); // Mostrar valor da rotação
        } else {
            const startDist = Math.hypot(startMousePos.x - startTransform.boxCenterX, startMousePos.y - startTransform.boxCenterY);
            const currentDist = Math.hypot(e.clientX - startTransform.boxCenterX, e.clientY - startTransform.boxCenterY);
            if (startDist > 0) {
                transformState.scale = startTransform.scale * (currentDist / startDist);
            }
        }
        
        if (handleType !== 'drag') {
            applyTransform();
        }
    }

    function onMouseUp() {
        transformBox.classList.remove('active');
        activeHandle = null;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    }
    
    // Rotação com teclado para precisão
    function handleKeyRotation(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
        
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            transformState.rotation -= 1;
            updateRotationDisplay();
            applyTransform();
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            transformState.rotation += 1;
            updateRotationDisplay();
            applyTransform();
        }
    }
    
    // Sistema de progresso
    function startProgress() {
        const downloadBtn = document.getElementById('download-btn');
        const loadingOverlay = document.getElementById('loading-overlay');
        
        // Ativar estado de loading
        downloadBtn.classList.add('loading');
        loadingOverlay.classList.add('active');
        downloadBtn.disabled = true;
        
        currentProgress = 0;
        updateProgress();
        
        // Simular progresso baseado no tempo real de geração
        progressInterval = setInterval(() => {
            if (currentProgress < 100) {
                currentProgress += Math.random() * 3; // Progresso variável
                if (currentProgress > 100) currentProgress = 100;
                updateProgress();
            }
        }, 100);
    }
    
    function updateProgress() {
        const progressText = document.getElementById('progress-text');
        const downloadBtn = document.getElementById('download-btn');
        
        // Atualizar mensagem baseada no progresso
        const roundedProgress = Math.round(currentProgress);
        const currentMessage = progressMessages
            .slice()
            .reverse()
            .find(msg => roundedProgress >= msg.progress);
        
        if (currentMessage) {
            progressText.textContent = currentMessage.message;
            
            // Ajustar largura do botão baseado no tamanho do texto
            const textWidth = progressText.scrollWidth;
            const minWidth = 160;
            const maxWidth = 400;
            const newWidth = Math.max(minWidth, Math.min(maxWidth, textWidth + 80));
            
            downloadBtn.style.width = `${newWidth}px`;
        }
    }
    
    function stopProgress() {
        const downloadBtn = document.getElementById('download-btn');
        const loadingOverlay = document.getElementById('loading-overlay');
        
        // Parar intervalo
        if (progressInterval) {
            clearInterval(progressInterval);
            progressInterval = null;
        }
        
        // Atualizar para 100%
        currentProgress = 100;
        updateProgress();
        
        // Aguardar um pouco antes de esconder
        setTimeout(() => {
            downloadBtn.classList.remove('loading');
            loadingOverlay.classList.remove('active');
            downloadBtn.disabled = false;
            
            // Resetar para estado original
            setTimeout(() => {
                const progressText = document.getElementById('progress-text');
                
                progressText.textContent = "Preparando...";
                currentProgress = 0;
                downloadBtn.style.width = '';
            }, 1000);
        }, 1500);
    }
    
    // --- EVENT LISTENERS GLOBAIS ---
    settingsBtns.forEach(btn => btn.addEventListener('click', () => openSettingsModal(btn.dataset.modal)));
    settingsModalContainer.querySelectorAll('.close-settings-modal-btn').forEach(btn => btn.addEventListener('click', closeSettingsModal));
    settingsModalContainer.addEventListener('click', e => { if (e.target === settingsModalContainer) closeSettingsModal(); });

    document.querySelectorAll('.size-preset').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.size-preset').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const contentNode = modalContents['size-settings-modal'].content;
            contentNode.querySelector('#width-input').value = btn.dataset.width;
            contentNode.querySelector('#height-input').value = btn.dataset.height;
            
            // Forçar centralização ao mudar resolução
            transformState.x = 0;
            transformState.y = 0;
            transformState.scale = 1;
            transformState.rotation = 0;
            
            applyStyles();
        });
    });
    
    // Ouvintes para controles que reiniciam a animação
    const animationControls = [textInput, document.getElementById('animation-select'), document.getElementById('animation-mode-select')];
    animationControls.forEach(el => el.addEventListener('input', () => rebuildAnimation()));

    // Ouvintes para controles que apenas mudam estilos
    const styleControls = [...document.querySelectorAll('[name="bg-type"]')];
    styleControls.forEach(el => el.addEventListener('input', () => applyStyles()));

    transformBox.addEventListener('mousedown', onMouseDown);
    window.addEventListener('resize', updateViewportScale);
    window.addEventListener('keydown', handleKeyRotation);
    downloadBtn.addEventListener('click', generateGif);
    
    // Outras lógicas de UI (modais, header, etc.)
    const servicesBtn = document.getElementById('services-btn');
    const subHeader = document.getElementById('sub-header');
    
    servicesBtn.addEventListener('click', () => {
        if (subHeader.classList.contains('hidden')) {
            subHeader.classList.remove('hidden');
            subHeader.classList.add('show');
            // Força o reflow para garantir que a animação funcione
            subHeader.offsetHeight;
            subHeader.classList.remove('-translate-y-full', 'opacity-0');
            subHeader.classList.add('translate-y-0', 'opacity-100');
        } else {
            subHeader.classList.add('-translate-y-full', 'opacity-0');
            subHeader.classList.remove('translate-y-0', 'opacity-100', 'show');
            // Esconde após a animação
            setTimeout(() => {
                subHeader.classList.add('hidden');
            }, 500);
        }
    });

    // Botão "Ver Todos os Serviços" do rodapé - abre o menu e rola para o topo
    const showAllServicesFooterBtn = document.getElementById('show-all-services-footer');
    if (showAllServicesFooterBtn) {
        showAllServicesFooterBtn.addEventListener('click', () => {
            // Abre o menu de serviços
            if (subHeader.classList.contains('hidden')) {
                subHeader.classList.remove('hidden');
                subHeader.classList.add('show');
                subHeader.offsetHeight;
                subHeader.classList.remove('-translate-y-full', 'opacity-0');
                subHeader.classList.add('translate-y-0', 'opacity-100');
            }
            
            // Rola para o topo da página
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
    
    const closeImageModalBtn = document.getElementById('close-image-modal-btn');
    const imageUploadInput = document.getElementById('image-upload-input');
    const imageModalTabs = document.getElementById('image-modal-tabs');
    closeImageModalBtn.addEventListener('click', () => imageModal.classList.add('hidden'));
    imageModalTabs.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            const tab = e.target.dataset.tab;
            document.querySelectorAll('#image-modal-tabs button').forEach(b => { b.classList.remove('border-blue-600', 'text-blue-600'); b.classList.add('border-transparent', 'text-gray-500'); });
            e.target.classList.add('border-blue-600', 'text-blue-600');
            document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
            document.getElementById(`tab-${tab}`).classList.remove('hidden');
        }
    });
    imageUploadInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                captureArea.style.backgroundImage = `url('${event.target.result}')`;
                captureArea.style.backgroundSize = 'cover';
                captureArea.style.backgroundPosition = 'center';
                imageModal.classList.add('hidden');
                document.querySelector('input[name="bg-type"][value="image"]').checked = true;
            };
            reader.readAsDataURL(file);
        }
    });

    // --- INICIALIZAÇÃO FINAL ---
    applyStyles(); // Aplicar estilos iniciais
    applyTransform();
    rebuildAnimation(); // Chamada inicial para configurar tudo
});
