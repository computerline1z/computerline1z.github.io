function random(min = 0, max = 1) {
	return Math.floor(Math.random() * (max - min + 1) + min);
}
function colorToText(r, g, b, a = 1) {
	return `rgba(${r},${g},${b},${a})`;
}
class Entity {
	static showAll(list) {
		for (let i = 0; i < list.length; i++) {
			if (!list[i].show()) {
				list.splice(i, 1);
			}
		}
	}
	constructor(x, y, ctx) {
		this.pos = { x, y };
        this.ctx = ctx;
	}
	show() {
		if (this.update()) {
			this.draw();
			return true;
		}
		else {
			return false;
		}
	}
}
class Strand extends Entity {
	constructor(x, canvas, ctx, charList, color) {
		super(x, Char.height, ctx);
		this.canvas = canvas;
		this.charList = charList;
		this.color = color;
		this.chars = [];
	}
	update() {
		if (this.chars.length < 1 || this.chars[this.chars.length - 1].pos.y < this.canvas.height * 2) {
			this.chars.push(new Char(this.pos.x, this.pos.y, this.ctx, this.charList, this.color));
			this.pos.y += Char.height;
			return true;
		}
		else {
			return false;
		}
	}
	draw() {
		Entity.showAll(this.chars);
	}
}
class Char extends Entity {
	static size = 20;
	static width = 12;
	static height = 14;
	constructor(x, y, ctx, charList, color) {
		super(x, y, ctx);
		this.charList = charList;
		this.color = color;
		this.head = true;
		this.alpha = 1;
		this.randomizeCharVal();
	}
	randomizeCharVal() {
		this.val = this.charList[random(0, this.charList.length - 1)];
	}
	update() {
		if (random(0, 100) < 5) {
			this.randomizeCharVal();
		}
		this.alpha *= 0.95;
		return (this.alpha >= 0.01) ? true : false;
	}
	draw() {
		this.ctx.font = Char.size + "px Monospace";
		if (!this.head) {
			this.ctx.fillStyle = colorToText(this.color.red, this.color.green, this.color.blue, this.alpha);
		}
		else {
			this.ctx.fillStyle = colorToText(255, 255, 255, 1);
			this.head = false;
		}
		this.ctx.fillText(this.val, this.pos.x, this.pos.y);
	}
}
class MatrixRain {
	constructor(element, width, height, charList, red, green, blue, randomColors, flowRate, fps) {
		this.canvas = element;
		this.setCanvasDimensions(width, height);
		this.charList = charList;
		this.color = { red, green, blue };
		this.randomColors = randomColors;
		this.flowRate = flowRate;
		this.ctx = this.canvas.getContext("2d");
		this.ctx.translate(this.canvas.width, 0);
		this.ctx.scale(-1, 1);
		this.columns = Math.ceil(this.canvas.width / Char.width);
		this.strands = [];
		// Thêm biến cho hiệu ứng typing (lặp lại)
		this.typingStart = Date.now();
		this.typingSpeed = 100;  // ms per character
		this.typingDelay = 1000;  // Delay trước khi lặp lại (ms), có thể điều chỉnh
		// Thêm biến cho hiệu ứng cursor blink (mượt mà với sin wave)
		this.cursorBlinkInterval = 500;  // Tốc độ nhấp nháy cursor (ms)
		this.cursorStartTime = Date.now();
		// Thêm biến cho hiệu ứng scan lines (flare ngang giống Matrix)
		this.scanLineTime = Date.now();
		this.scanLineSpeed = 1;  // Tốc độ di chuyển scan lines chậm hơn (pixels/frame)
		this.scanLineSpacing = 2;  // Khoảng cách giữa các scan lines nhỏ hơn để dày đặc
		this.scanLineThickness = 1;  // Độ dày scan line
		this.scanLineAlphaBase = 0.1;  // Alpha cơ bản cao hơn để dễ thấy
		// Thêm biến cho hiệu ứng assembly code typing
		this.asmStartTime = Date.now();
		this.asmTypingSpeed = 50;  // ms per character cho assembly (nhanh hơn)
		this.asmLineHeight = 16;
		this.asmFontSize = 12;  // Giảm font để fit nhiều dòng hơn
		this.asmNumLines = 20;  // Tăng số dòng để chiếm nhiều màn hình hơn
		this.asmCodeLines = this.generateAssemblyLines();  // Tạo 20 dòng ngẫu nhiên dài hơn
		this.asmCycleTime = this.asmCodeLines.reduce((sum, line) => sum + line.length * this.asmTypingSpeed, 0) + 3000;  // Tăng delay
		// Thêm biến cho hiệu ứng debug registers
		this.regStartTime = Date.now();
		this.regUpdateInterval = 150;  // Cập nhật registers nhanh hơn
		this.regFontSize = 10;  // Giảm font để fit
		this.regLineHeight = 12;
		this.regNumRegs = 8;  // Số registers hiển thị
		this.registers = this.initRegisters();  // Khởi tạo registers
		// Thêm biến cho CPU flags
		this.flags = this.initFlags();
		this.flagUpdateInterval = 100;  // Cập nhật flags nhanh
		this.flagStartTime = Date.now();
		// Thêm biến cho hiệu ứng memory dump
		this.memDumpStartTime = Date.now();
		this.memDumpUpdateInterval = 200;  // Cập nhật memory dump mỗi 200ms
		this.memDumpFontSize = 10;
		this.memDumpLineHeight = 12;
		this.memDumpNumLines = 15;  // Số dòng hex dump
		this.memDumpBytesPerLine = 16;  // Bytes per line
		this.memDumpStartAddr = 0x1000;  // Địa chỉ bắt đầu
		this.memory = this.initMemoryDump();  // Khởi tạo memory
		// Thêm biến cho hiệu ứng stack dump
		this.stackDumpStartTime = Date.now();
		this.stackDumpUpdateInterval = 250;  // Cập nhật stack mỗi 250ms
		this.stackDumpFontSize = 10;
		this.stackDumpLineHeight = 12;
		this.stackDumpNumLines = 12;  // Số dòng stack dump
		this.stackDumpMaxDepth = 64;  // Độ sâu stack tối đa
		this.stack = this.initStackDump();  // Khởi tạo stack
		this.stackPointer = 0;  // Con trỏ stack
		// Thêm biến cho debug errors và warnings
		this.debugLogs = [];  // Mảng các log messages
		this.debugLogInterval = 3000;  // Thêm log mới mỗi 3s
		this.debugLogStartTime = Date.now();
		this.debugLogMaxLines = 8;  // Số dòng log tối đa
		this.debugLogScrollSpeed = 1;  // Tốc độ scroll (pixels/frame)
		this.debugLogY = 0;  // Vị trí Y cho scroll
		this.debugLogMessages = this.generateDebugMessages();  // Tạo messages mẫu
		// Thêm biến cho console typing effect
		this.consoleStartTime = Date.now();
		this.consoleTypingSpeed = 80;  // ms per character cho console
		this.consoleLineHeight = 14;
		this.consoleFontSize = 11;
		this.consoleNumLines = 6;  // Số dòng console
		this.consoleCommands = ['ls -la', 'gcc main.c -o app', 'gdb ./app', 'echo "Debugging..."', 'valgrind --leak-check=full ./app', 'strace -e trace=file ./app'];
		this.consoleCycleTime = this.consoleCommands.reduce((sum, cmd) => sum + cmd.length * this.consoleTypingSpeed, 0) + 2000;
		this.consoleCurrentLine = 0;
		this.consoleCharIndex = 0;
		this.consolePrompt = '$ ';
		// Thêm logo Anonymous
		this.logoImage = new Image();
		this.logoImage.src = 'https://pngimg.com/d/bitcoin_PNG14.png';
		this.logoLoaded = false;
		this.logoImage.onload = () => {
			this.logoLoaded = true;
		};
		setInterval(() => {
			this.run();
		}, 1000 / fps);
	}
	initRegisters() {
		const regs = [
			{ name: 'EAX', value: 0x00000000 },
			{ name: 'EBX', value: 0x00000000 },
			{ name: 'ECX', value: 0x00000000 },
			{ name: 'EDX', value: 0x00000000 },
			{ name: 'ESI', value: 0x00000000 },
			{ name: 'EDI', value: 0x00000000 },
			{ name: 'EBP', value: 0x00000000 },
			{ name: 'ESP', value: 0x00000000 }
		];
		return regs;
	}
	initFlags() {
		return [
			{ name: 'CF', value: 0 },
			{ name: 'PF', value: 0 },
			{ name: 'AF', value: 0 },
			{ name: 'ZF', value: 0 },
			{ name: 'SF', value: 0 },
			{ name: 'TF', value: 0 },
			{ name: 'IF', value: 0 },
			{ name: 'DF', value: 0 },
			{ name: 'OF', value: 0 }
		];
	}
	initMemoryDump() {
		const mem = new Array(0x10000).fill(0);  // 64KB memory, init to 0
		// Fill with random data
		for (let i = 0; i < mem.length; i++) {
			mem[i] = random(0, 255);
		}
		return mem;
	}
	initStackDump() {
		const stack = new Array(this.stackDumpMaxDepth).fill(0);  // Stack init to 0
		// Fill with random data
		for (let i = 0; i < stack.length; i++) {
			stack[i] = random(0, 255);
		}
		return stack;
	}
	updateRegistersAndFlags() {
		const regElapsed = Date.now() - this.regStartTime;
		const flagElapsed = Date.now() - this.flagStartTime;
		if (regElapsed >= this.regUpdateInterval || flagElapsed >= this.flagUpdateInterval) {
			// Mô phỏng thay đổi dựa trên "lệnh đang chạy" - random nhưng có pattern
			const changeChance = random(0, 100);
			if (changeChance < 40) {  // Tăng chance thay đổi để động hơn
				const regIdx = random(0, this.registers.length - 1);
				const delta = random(-0x1000, 0x1000);  // Thay đổi nhỏ, mượt
				this.registers[regIdx].value = (this.registers[regIdx].value + delta + 0xFFFFFFFF + 1) & 0xFFFFFFFF;  // Wrap around
			}
			if (random(0, 100) < 50) {  // 50% chance thay đổi flag
				const flagIdx = random(0, this.flags.length - 1);
				this.flags[flagIdx].value = random(0, 1);
			}
			this.regStartTime = Date.now();
			this.flagStartTime = Date.now();
		}
	}
	updateMemoryDump() {
		const elapsed = Date.now() - this.memDumpStartTime;
		if (elapsed >= this.memDumpUpdateInterval) {
			// Cập nhật ngẫu nhiên một số bytes
			for (let i = 0; i < 32; i++) {  // Update 32 bytes mỗi lần
				const addr = (this.memDumpStartAddr + random(0, this.memory.length - 1)) % this.memory.length;
				this.memory[addr] = random(0, 255);
			}
			this.memDumpStartTime = Date.now();
		}
	}
	updateStackDump() {
		const elapsed = Date.now() - this.stackDumpStartTime;
		if (elapsed >= this.stackDumpUpdateInterval) {
			// Mô phỏng push/pop ngẫu nhiên
			if (random(0, 100) < 60) {  // 60% chance push/pop
				if (random(0, 1) === 0 && this.stackPointer < this.stackDumpMaxDepth - 1) {
					// Push
					this.stackPointer++;
					this.stack[this.stackPointer] = random(0, 255);
				} else if (this.stackPointer > 0) {
					// Pop
					this.stack[this.stackPointer] = 0;
					this.stackPointer--;
				}
			}
			// Random update một số entries
			for (let i = 0; i < 8; i++) {
				const idx = random(0, this.stackDumpMaxDepth - 1);
				if (idx <= this.stackPointer) {  // Chỉ update nếu trong stack
					this.stack[idx] = random(0, 255);
				}
			}
			this.stackDumpStartTime = Date.now();
		}
	}
	generateDebugMessages() {
		const errors = [
			'Segmentation fault (core dumped)',
			'Bus error: Invalid memory access',
			'Floating point exception: Divide by zero',
			'Illegal instruction: Opcode mismatch',
			'Stack overflow detected',
			'Null pointer dereference at 0xDEADBEEF',
			'Buffer overflow in function main()',
			'Memory leak: 128 bytes unallocated'
		];
		const warnings = [
			'Deprecated function used: printf()',
			'Unsigned integer overflow on line 42',
			'Potential race condition in thread 3',
			'Resource leak: File handle not closed',
			'Inefficient loop: O(n^2) complexity',
			'Variable shadowed in scope: i',
			'Magic number 0xCAFEBABE without define',
			'Format string mismatch in scanf()'
		];
		const types = [
			{ type: 'ERROR', color: { r: 255, g: 0, b: 0 }, msg: () => errors[random(0, errors.length - 1)] },
			{ type: 'WARN', color: { r: 255, g: 255, b: 0 }, msg: () => warnings[random(0, warnings.length - 1)] }
		];
		return types;
	}
	updateDebugLogs() {
		const elapsed = Date.now() - this.debugLogStartTime;
		if (elapsed >= this.debugLogInterval) {
			// Thêm log mới
			const type = this.debugLogMessages[random(0, this.debugLogMessages.length - 1)];
			const message = `${type.type}: ${type.msg()} [${new Date().toISOString().slice(11, 19)}]`;
			this.debugLogs.unshift({ text: message, color: type.color, alpha: 1, timestamp: Date.now() });  // Unshift để mới nhất ở trên
			if (this.debugLogs.length > this.debugLogMaxLines) {
				this.debugLogs.pop();  // Giữ số dòng max
			}
			this.debugLogStartTime = Date.now();
		}
		// Fade out logs cũ
		this.debugLogs.forEach(log => {
			const age = Date.now() - log.timestamp;
			if (age > 10000) {  // Logs sống 10s
				log.alpha *= 0.98;
			}
		});
		this.debugLogs = this.debugLogs.filter(log => log.alpha > 0.01);
	}
	generateAssemblyLines() {
		const registers = ['AX', 'BX', 'CX', 'DX', 'SI', 'DI', 'BP', 'SP', 'EAX', 'EBX', 'ECX', 'EDX', 'ESI', 'EDI', 'EBP', 'ESP'];
		const ops = ['MOV', 'ADD', 'SUB', 'CMP', 'JMP', 'CALL', 'RET', 'INT', 'NOP', 'PUSH', 'POP', 'INC', 'DEC', 'AND', 'OR', 'XOR', 'SHL', 'SHR', 'IMUL', 'IDIV', 'LEA'];
		const labels = ['LOOP1', 'START', 'END', 'MAIN', 'ERROR', 'SUCCESS', 'CHECK', 'DONE', 'INIT', 'CLEANUP'];
		const segments = ['DATA', 'CODE', 'BSS', 'STACK', 'HEAP'];
		const memoryTypes = ['BYTE', 'WORD', 'DWORD', 'QWORD'];
		const immediates = ['0x1234', '0xABCD', '0xDEADBEEF', '0xCAFEBABE'];
		const comments = [
			'; Initialize stack pointer and base pointer',
			'; Compare values and jump if carry flag set',
			'; Multiply extended accumulator by source register',
			'; Load effective address into destination register',
			'; Shift left logical by count in CL register',
			'; Handle division by zero error routine',
			'; Loop until counter reaches zero with decrement',
			'; Bitwise XOR for encryption/decryption',
			'; Push parameters onto stack for function call',
			'; Pop return value from stack into accumulator'
		];
		const lines = [];
		for (let i = 0; i < this.asmNumLines; i++) {
			const rand = random(0, 100);
			if (rand < 8) {
				// Label
				const label = labels[random(0, labels.length - 1)];
				lines.push(`${label}:`);
			} else if (rand < 18) {
				// Comment dài hơn
				const comment = comments[random(0, comments.length - 1)];
				lines.push(`  ${comment}`);
			} else if (rand < 25) {
				// Directive
				const seg = segments[random(0, segments.length - 1)];
				lines.push(`.section ${seg} ; Define section for data/code`);
			} else if (rand < 30) {
				// Empty line for spacing
				lines.push('');
			} else {
				// Instruction dài hơn
				const op = ops[random(0, ops.length - 1)];
				let line = `  ${op} `;
				if (op === 'JMP' || op === 'CALL') {
					line += `short ${labels[random(0, labels.length - 1)]} ; Conditional jump`;
				} else if (op === 'INT' || op === 'NOP' || op === 'RET') {
					line += ` ; Software interrupt or return`;
				} else if (op === 'PUSH' || op === 'POP') {
					line += `${registers[random(0, registers.length - 1)]} ; Push/pop to/from stack`;
				} else if (op === 'INC' || op === 'DEC') {
					line += `${registers[random(0, registers.length - 1)]} ; Increment/decrement register`;
				} else if (op === 'LEA') {
					const reg1 = registers[random(0, registers.length - 1)];
					const addr = `[${registers[random(0, registers.length - 1)] + random(0, 0x100)}]`;
					line += `${reg1}, ${addr} ; Load effective address`;
				} else {
					const reg1 = registers[random(0, registers.length - 1)];
					const rand2 = random(0, 100);
					if (rand2 < 40) {
						// Reg to reg
						const reg2 = registers[random(0, registers.length - 1)];
						line += `${reg1}, ${reg2} ; Register to register operation`;
					} else if (rand2 < 70) {
						// Immediate value dài
						const imm = immediates[random(0, immediates.length - 1)];
						line += `${reg1}, ${imm} ; Immediate value load/add`;
					} else {
						// Memory phức tạp
						const memType = memoryTypes[random(0, memoryTypes.length - 1)];
						const addr = `[${registers[random(0, registers.length - 1)] + random(0, 0x100)}h]`;
						line += `${reg1}, ${addr} ; Memory operand with ${memType.toLowerCase()}`;
					}
				}
				lines.push(line);
			}
		}
		return lines;
	}
	setCanvasDimensions(width, height) {
		this.canvas.width = width;
		this.canvas.height = height;
		this.columns = Math.ceil(this.canvas.width / Char.width);
	}
	drawLogo() {
		if (!this.logoLoaded) return;
		// Lưu trạng thái context hiện tại (đã bị lật)
		this.ctx.save();
		// Reset transform về trạng thái mặc định để logo không bị lật
		this.ctx.resetTransform();
		const logoSize = 350; // Kích thước logo to
		const x = (this.canvas.width - logoSize) / 2;
		const y = (this.canvas.height / 2) - (logoSize / 2) - 100; // Đặt ở giữa, trên text một chút
		this.ctx.drawImage(this.logoImage, x, y, logoSize, logoSize);
		// Restore trạng thái
		this.ctx.restore();
	}
	drawNeonText() {
		const fullText = "ACCESS DENIED";
		const fontSize = 74;
		// Lưu trạng thái context hiện tại (đã bị lật)
		this.ctx.save();
		// Reset transform về trạng thái mặc định để chữ không bị lật
		this.ctx.resetTransform();
		this.ctx.font = `${fontSize}px Monospace`;
		this.ctx.textAlign = 'left';  // Left align cho typing effect
		this.ctx.textBaseline = 'middle';

		// Tính toán độ dài hiện tại cho typing effect
		let typingElapsed = Date.now() - this.typingStart;
		let currentLength = Math.floor(typingElapsed / this.typingSpeed);
		if (currentLength > fullText.length) {
			// Đợi delay rồi reset để lặp lại
			const totalCycleTime = fullText.length * this.typingSpeed + this.typingDelay;
			if (typingElapsed >= totalCycleTime) {
				this.typingStart = Date.now();
				typingElapsed = 0;
				currentLength = 0;
			} else {
				// Trong delay, hiển thị full text
				currentLength = fullText.length;
			}
		}
		const displayedText = fullText.substring(0, currentLength);

		// Đo width của full text để căn giữa
		const fullWidth = this.ctx.measureText(fullText).width;
		const x_start = (this.canvas.width / 2) - (fullWidth / 2);
		const y = this.canvas.height / 2 + 50; // Dịch xuống dưới logo

		// Alpha luôn là 1 (không blink cho text)
		const alpha = 1;

		if (currentLength === 0) {
			this.ctx.restore();
			return;
		}

		// Tạo hiệu ứng neon với alpha, màu đỏ
		const neonColor = `rgba(255, 0, 0, ${alpha})`;
		const layers = 5;
		const maxBlur = 30;

		for (let i = layers; i > 0; i--) {
			this.ctx.shadowColor = neonColor;
			this.ctx.shadowBlur = (maxBlur / layers) * i;
			this.ctx.fillStyle = neonColor;
			this.ctx.fillText(displayedText, x_start, y);
		}

		// Lớp text chính
		this.ctx.shadowBlur = 0;
		this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
		this.ctx.fillText(displayedText, x_start, y);

		// Vẽ cursor nếu đang typing (không phải delay)
		if (currentLength < fullText.length && typingElapsed < fullText.length * this.typingSpeed) {
			const cursorX = x_start + this.ctx.measureText(displayedText).width;
			const cursorBlinkElapsed = Date.now() - this.cursorStartTime;
			// Hiệu ứng mượt mà: Sử dụng sin wave để fade in/out
			const cursorAlpha = (Math.sin(cursorBlinkElapsed / this.cursorBlinkInterval * Math.PI * 2) + 1) / 2 * alpha;

			// Neon cho cursor
			for (let i = layers; i > 0; i--) {
				this.ctx.shadowColor = neonColor;
				this.ctx.shadowBlur = (maxBlur / layers) * i;
				this.ctx.fillStyle = `rgba(255, 0, 0, ${cursorAlpha})`;
				this.ctx.fillText('|', cursorX, y);
			}
			// Lớp cursor chính
			this.ctx.shadowBlur = 0;
			this.ctx.fillStyle = `rgba(255, 255, 255, ${cursorAlpha})`;
			this.ctx.fillText('|', cursorX, y);
		}

		// Reset và restore
		this.ctx.textAlign = 'start';
		this.ctx.textBaseline = 'alphabetic';
		this.ctx.restore();
	}
	drawAssemblyCode() {
		// Lưu trạng thái context
		this.ctx.save();
		this.ctx.resetTransform();
		this.ctx.font = `${this.asmFontSize}px Monospace`;
		this.ctx.textAlign = 'left';
		this.ctx.textBaseline = 'top';

		const asmElapsed = Date.now() - this.asmStartTime;
		let currentCharIndex = 0;
		let isTyping = false;

		// Tính tổng ký tự đã gõ
		for (let lineIdx = 0; lineIdx < this.asmCodeLines.length; lineIdx++) {
			const lineLength = this.asmCodeLines[lineIdx].length;
			const lineTime = lineLength * this.asmTypingSpeed;
			if (asmElapsed < currentCharIndex + lineTime) {
				// Đang typing dòng này
				isTyping = true;
				const lineElapsed = asmElapsed - currentCharIndex;
				const charsInLine = Math.floor(lineElapsed / this.asmTypingSpeed);
				const displayedLine = this.asmCodeLines[lineIdx].substring(0, charsInLine);
				this.drawAsmLine(lineIdx, displayedLine, lineIdx === Math.floor(asmElapsed / this.asmTypingSpeed));  // Cursor chỉ ở dòng hiện tại
				// Vẽ các dòng trước đầy đủ
				for (let prevIdx = 0; prevIdx < lineIdx; prevIdx++) {
					this.drawAsmLine(prevIdx, this.asmCodeLines[prevIdx], false);
				}
				// Vẽ các dòng sau trống hoặc partial nếu cần, nhưng để đơn giản trống
				for (let nextIdx = lineIdx + 1; nextIdx < this.asmNumLines; nextIdx++) {
					this.drawAsmLine(nextIdx, '', false);
				}
				break;
			}
			currentCharIndex += lineTime;
		}

		// Nếu hoàn thành tất cả dòng, chờ delay rồi reset
		if (asmElapsed >= this.asmCycleTime) {
			this.asmStartTime = Date.now();
			this.asmCodeLines = this.generateAssemblyLines();  // Tạo mới ngẫu nhiên
		} else if (asmElapsed >= currentCharIndex && !isTyping) {
			// Hiển thị đầy đủ tất cả dòng
			for (let i = 0; i < this.asmNumLines; i++) {
				this.drawAsmLine(i, this.asmCodeLines[i], false);
			}
		}

		this.ctx.restore();
	}
	drawAsmLine(lineIdx, text, showCursor) {
		const y = this.canvas.height - (this.asmNumLines - lineIdx) * this.asmLineHeight - 50;  // Điều chỉnh để fit toàn màn hình dưới
		const x = 20;  // Margin trái

		// Vẽ text
		this.ctx.fillStyle = colorToText(0, 255, 0, 0.8);  // Xanh matrix
		this.ctx.fillText(text, x, y);

		// Cursor nếu cần
		if (showCursor && text.length > 0) {
			const cursorX = x + this.ctx.measureText(text).width;
			const cursorBlinkElapsed = Date.now() - this.cursorStartTime;
			const cursorAlpha = (Math.sin(cursorBlinkElapsed / this.cursorBlinkInterval * Math.PI * 2) + 1) / 2;
			this.ctx.fillStyle = colorToText(0, 255, 0, cursorAlpha);
			this.ctx.fillText('|', cursorX, y);
		}
	}
	drawDebugRegisters() {
		// Cập nhật registers và flags
		this.updateRegistersAndFlags();

		// Lưu trạng thái context
		this.ctx.save();
		this.ctx.resetTransform();
		this.ctx.font = `${this.regFontSize}px Monospace`;
		this.ctx.textAlign = 'left';
		this.ctx.textBaseline = 'top';

		// Vị trí: Bên phải assembly code, ở cuối màn hình, điều chỉnh để fit
		const regX = this.canvas.width - 250;  // Cách phải rộng hơn
		const regYStart = this.canvas.height - (this.regNumRegs + 10) * this.regLineHeight - 50;  // Flags dưới registers

		// Vẽ tiêu đề registers
		this.ctx.fillStyle = colorToText(255, 255, 0, 0.9);  // Vàng cho tiêu đề
		this.ctx.fillText('DEBUG REGISTERS:', regX, regYStart - 5);

		// Vẽ từng register
		this.registers.forEach((reg, idx) => {
			const y = regYStart + idx * this.regLineHeight;
			const valueHex = '0x' + reg.value.toString(16).toUpperCase().padStart(8, '0');

			// Tên register
			this.ctx.fillStyle = colorToText(255, 255, 255, 0.7);  // Trắng nhạt
			this.ctx.fillText(`${reg.name}:`, regX, y);

			// Giá trị
			this.ctx.fillStyle = colorToText(0, 255, 0, 0.9);  // Xanh sáng
			this.ctx.fillText(valueHex, regX + 50, y);
		});

		// Vẽ tiêu đề flags
		const flagYStart = regYStart + this.regNumRegs * this.regLineHeight + 5;
		this.ctx.fillStyle = colorToText(255, 255, 0, 0.9);
		this.ctx.fillText('CPU FLAGS:', regX, flagYStart - 5);

		// Vẽ flags (2 hàng nếu cần)
		this.flags.forEach((flag, idx) => {
			const y = flagYStart + Math.floor(idx / 5) * this.regLineHeight + (idx % 5) * (this.regLineHeight / 2);  // Compact
			const flagState = flag.value ? 'SET' : 'CLR';
			const flagColor = flag.value ? colorToText(0, 255, 0, 1) : colorToText(255, 0, 0, 0.7);

			this.ctx.fillStyle = colorToText(255, 255, 255, 0.7);
			this.ctx.fillText(`${flag.name}:`, regX, y);
			this.ctx.fillStyle = flagColor;
			this.ctx.fillText(flagState, regX + 30, y);
		});

		this.ctx.restore();
	}
	drawMemoryDump() {
		// Cập nhật memory
		this.updateMemoryDump();

		// Lưu trạng thái context
		this.ctx.save();
		this.ctx.resetTransform();
		this.ctx.font = `${this.memDumpFontSize}px Monospace`;
		this.ctx.textAlign = 'left';
		this.ctx.textBaseline = 'top';

		// Vị trí: Giữa assembly và registers, ở cuối màn hình
		const memX = 300;  // Giữa (sau asm 20px + asm width ~250)
		const memYStart = this.canvas.height - this.memDumpNumLines * this.memDumpLineHeight - 50;

		// Vẽ tiêu đề
		this.ctx.fillStyle = colorToText(255, 255, 0, 0.9);  // Vàng
		this.ctx.fillText('MEMORY DUMP:', memX, memYStart - 5);

		// Vẽ hex dump
		for (let lineIdx = 0; lineIdx < this.memDumpNumLines; lineIdx++) {
			const addr = (this.memDumpStartAddr + lineIdx * this.memDumpBytesPerLine) & 0xFFFF;
			const addrHex = '0x' + addr.toString(16).toUpperCase().padStart(4, '0');
			const y = memYStart + lineIdx * this.memDumpLineHeight;

			// Address
			this.ctx.fillStyle = colorToText(255, 255, 255, 0.7);
			this.ctx.fillText(addrHex, memX, y);

			// Hex bytes
			let hexStr = '';
			let asciiStr = '';
			for (let byteIdx = 0; byteIdx < this.memDumpBytesPerLine; byteIdx++) {
				const byteAddr = addr + byteIdx;
				const byte = this.memory[byteAddr % this.memory.length];
				const byteHex = byte.toString(16).toUpperCase().padStart(2, '0');
				hexStr += byteHex + ' ';
				const char = String.fromCharCode(byte);
				asciiStr += (byte >= 32 && byte <= 126) ? char : '.';
			}

			// Hex values
			this.ctx.fillStyle = colorToText(0, 255, 0, 0.8);
			this.ctx.fillText(hexStr.trim(), memX + 60, y);

			// ASCII
			this.ctx.fillStyle = colorToText(128, 128, 128, 0.6);  // Xám cho ASCII
			this.ctx.fillText(asciiStr, memX + 60 + (this.memDumpBytesPerLine * 3 * 8), y);
		}

		this.ctx.restore();
	}
	drawStackDump() {
		// Cập nhật stack
		this.updateStackDump();

		// Lưu trạng thái context
		this.ctx.save();
		this.ctx.resetTransform();
		this.ctx.font = `${this.stackDumpFontSize}px Monospace`;
		this.ctx.textAlign = 'left';
		this.ctx.textBaseline = 'top';

		// Vị trí: Bên trái assembly, ở cuối màn hình
		const stackX = 20;  // Trái cùng
		const stackYStart = this.canvas.height - this.stackDumpNumLines * this.stackDumpLineHeight - 50;

		// Vẽ tiêu đề
		this.ctx.fillStyle = colorToText(255, 255, 0, 0.9);  // Vàng
		this.ctx.fillText('STACK DUMP:', stackX, stackYStart - 5);
		this.ctx.fillStyle = colorToText(255, 255, 255, 0.7);
		this.ctx.fillText(`SP: 0x${this.stackPointer.toString(16).toUpperCase().padStart(4, '0')}`, stackX + 100, stackYStart - 5);

		// Vẽ stack dump (hiển thị từ SP xuống dưới, chỉ phần active)
		for (let lineIdx = 0; lineIdx < this.stackDumpNumLines; lineIdx++) {
			const addr = (0x2000 - lineIdx * this.memDumpBytesPerLine) & 0xFFFF;  // Giả lập địa chỉ stack giảm dần
			const addrHex = '0x' + addr.toString(16).toUpperCase().padStart(4, '0');
			const y = stackYStart + lineIdx * this.stackDumpLineHeight;

			// Address
			this.ctx.fillStyle = colorToText(255, 255, 255, 0.7);
			this.ctx.fillText(addrHex, stackX, y);

			// Hex bytes (từ stack, chỉ active nếu addr >= SP)
			let hexStr = '';
			let asciiStr = '';
			for (let byteIdx = 0; byteIdx < this.memDumpBytesPerLine; byteIdx++) {
				const stackIdx = this.stackDumpMaxDepth - (lineIdx * this.memDumpBytesPerLine + byteIdx + 1);  // Map to stack index
				let byte = 0;
				if (stackIdx >= 0 && stackIdx < this.stackDumpMaxDepth && stackIdx <= this.stackPointer) {
					byte = this.stack[stackIdx];
				}
				const byteHex = byte.toString(16).toUpperCase().padStart(2, '0');
				hexStr += byteHex + ' ';
				const char = String.fromCharCode(byte);
				asciiStr += (byte >= 32 && byte <= 126) ? char : '.';
			}

			// Hex values (màu khác nếu inactive)
			const isActive = addr >= (0x2000 - this.stackPointer);
			this.ctx.fillStyle = isActive ? colorToText(0, 255, 0, 0.8) : colorToText(128, 128, 128, 0.4);
			this.ctx.fillText(hexStr.trim(), stackX + 60, y);

			// ASCII
			this.ctx.fillStyle = colorToText(128, 128, 128, 0.6);
			this.ctx.fillText(asciiStr, stackX + 60 + (this.memDumpBytesPerLine * 3 * 8), y);
		}

		this.ctx.restore();
	}
	drawDebugLogs() {
		// Cập nhật logs
		this.updateDebugLogs();

		// Lưu trạng thái context
		this.ctx.save();
		this.ctx.resetTransform();
		this.ctx.font = `${this.regFontSize}px Monospace`;
		this.ctx.textAlign = 'left';
		this.ctx.textBaseline = 'top';

		// Vị trí: Trên cùng, scroll từ trên xuống
		const logX = 20;
		const logYStart = 20 + this.debugLogY;  // Scroll effect

		// Vẽ tiêu đề
		this.ctx.fillStyle = colorToText(255, 255, 0, 0.9);
		this.ctx.fillText('DEBUG LOG:', logX, 15);

		// Scroll: Tăng Y để scroll xuống (logs mới ở trên)
		this.debugLogY += this.debugLogScrollSpeed;
		if (this.debugLogY > this.debugLogMaxLines * this.regLineHeight) {
			this.debugLogY = 0;
		}

		// Vẽ logs
		this.debugLogs.forEach((log, idx) => {
			const y = logYStart + idx * this.regLineHeight;
			if (y < this.canvas.height && y > 0) {  // Chỉ vẽ nếu visible
				this.ctx.fillStyle = colorToText(log.color.r, log.color.g, log.color.b, log.alpha);
				this.ctx.fillText(log.text, logX, y);
			}
		});

		this.ctx.restore();
	}
	drawConsoleTyping() {
		// Lưu trạng thái context
		this.ctx.save();
		this.ctx.resetTransform();
		this.ctx.font = `${this.consoleFontSize}px Monospace`;
		this.ctx.textAlign = 'left';
		this.ctx.textBaseline = 'top';

		const consoleElapsed = Date.now() - this.consoleStartTime;
		const yStart = 20;  // Trên cùng, dưới debug logs nếu có

		// Nếu hoàn thành cycle, reset
		if (consoleElapsed >= this.consoleCycleTime) {
			this.consoleStartTime = Date.now();
			this.consoleCurrentLine = 0;
			this.consoleCharIndex = 0;
		}

		let currentTime = 0;
		for (let lineIdx = 0; lineIdx < this.consoleNumLines; lineIdx++) {
			const cmd = this.consoleCommands[lineIdx % this.consoleCommands.length];
			const promptTime = this.consolePrompt.length * this.consoleTypingSpeed;
			const cmdTime = cmd.length * this.consoleTypingSpeed;
			const totalLineTime = promptTime + cmdTime + 500;  // Pause sau mỗi lệnh

			if (consoleElapsed < currentTime + totalLineTime) {
				// Vẽ lines trước đầy đủ
				for (let prev = 0; prev < lineIdx; prev++) {
					const prevCmd = this.consoleCommands[prev % this.consoleCommands.length];
					this.drawConsoleLine(yStart + prev * this.consoleLineHeight, `${this.consolePrompt}${prevCmd}`);
				}
				// Vẽ line hiện tại với typing
				const lineElapsed = consoleElapsed - currentTime;
				let displayedCmd = '';
				let showCursor = false;
				if (lineElapsed > promptTime) {
					const cmdElapsed = lineElapsed - promptTime;
					this.consoleCharIndex = Math.floor(cmdElapsed / this.consoleTypingSpeed);
					if (this.consoleCharIndex < cmd.length) {
						displayedCmd = cmd.substring(0, this.consoleCharIndex);
						showCursor = true;
					} else {
						displayedCmd = cmd;
					}
				}
				const lineText = `${this.consolePrompt}${displayedCmd}`;
				this.drawConsoleLine(yStart + lineIdx * this.consoleLineHeight, lineText, showCursor);
				// Dừng ở đây
				break;
			}
			currentTime += totalLineTime;
		}

		// Vẽ lines sau trống
		for (let next = this.consoleNumLines; next < this.consoleNumLines; next++) {
			this.drawConsoleLine(yStart + next * this.consoleLineHeight, this.consolePrompt);
		}

		this.ctx.restore();
	}
	drawConsoleLine(y, text, showCursor = false) {
		const x = 20;
		this.ctx.fillStyle = colorToText(0, 255, 0, 0.7);  // Xanh console
		this.ctx.fillText(text, x, y);

		if (showCursor) {
			const cursorX = x + this.ctx.measureText(text).width;
			const cursorBlinkElapsed = Date.now() - this.cursorStartTime;
			const cursorAlpha = (Math.sin(cursorBlinkElapsed / this.cursorBlinkInterval * Math.PI * 2) + 1) / 2;
			this.ctx.fillStyle = colorToText(0, 255, 0, cursorAlpha);
			this.ctx.fillText('|', cursorX, y);
		}
	}
	drawScanLines() {
		// Lưu trạng thái context (vì có thể bị lật)
		this.ctx.save();
		// Reset transform để scan lines không bị lật
		this.ctx.resetTransform();

		const elapsed = Date.now() - this.scanLineTime;
		// Tính offset mượt mà dựa trên thời gian thực (giả sử 60fps, nhưng dùng elapsed để chính xác)
		const frameTime = elapsed / (1000 / 60);  // Chuẩn hóa theo 60fps
		let offset = (frameTime * this.scanLineSpeed) % this.scanLineSpacing;

		// Để mượt hơn, làm offset di chuyển liên tục (không floor)
		// Vẽ các đường ngang scan lines với alpha biến đổi nhẹ để tạo cảm giác quét
		let lineIndex = 0;
		for (let y = -this.canvas.height; y < this.canvas.height * 2; y += this.scanLineSpacing) {
			// Tính vị trí tương đối so với offset để tạo gradient alpha (mượt hơn)
			const relativeY = (y + offset) % (this.scanLineSpacing * 2);
			let lineAlpha = this.scanLineAlphaBase;
			if (relativeY < this.scanLineSpacing) {
				// Fade in/out cho mượt mà
				lineAlpha *= (relativeY / this.scanLineSpacing) * 2;  // Tăng dần
			} else {
				lineAlpha *= ((this.scanLineSpacing * 2 - relativeY) / this.scanLineSpacing) * 2;  // Giảm dần
			}

			// Xen kẽ màu: Chẵn - xanh, lẻ - đỏ
			const isEven = lineIndex % 2 === 0;
			const lineColor = isEven ? `rgba(0, 255, 0, ${lineAlpha})` : `rgba(255, 0, 0, ${lineAlpha})`;

			this.ctx.strokeStyle = lineColor;
			this.ctx.lineWidth = this.scanLineThickness;
			this.ctx.lineCap = 'round';  // Làm đầu đường mượt

			this.ctx.beginPath();
			this.ctx.moveTo(0, y);
			this.ctx.lineTo(this.canvas.width, y);
			this.ctx.stroke();

			lineIndex++;
		}

		this.ctx.restore();
	}
	run() {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.ctx.fillStyle = colorToText(0, 0, 0, 1);
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

		// Vẽ scan lines (flare ngang) trước chữ để chữ nằm trên
		this.drawScanLines();

		// Vẽ logo ở giữa
		this.drawLogo();

		// Vẽ chữ neon ở giữa, dưới logo
		this.drawNeonText();

		// Vẽ console typing ở trên
		this.drawConsoleTyping();

		// Vẽ debug logs ở trên console
		this.drawDebugLogs();

		// Vẽ assembly code ở cuối (mở rộng để fit toàn màn hình dưới)
		this.drawAssemblyCode();

		// Vẽ stack dump ở trái dưới
		this.drawStackDump();

		// Vẽ memory dump ở giữa dưới
		this.drawMemoryDump();

		// Vẽ debug registers và flags ở cuối phải
		this.drawDebugRegisters();

		let column, available;
		for (let i = 0; i < this.flowRate; i++) {
			column = random(0, this.columns);
			available = true;
			for (let j = 0; j < this.strands.length; j++) {  // Sửa i thành j để tránh conflict
				if (this.strands[j].pos.x == column * Char.width && this.strands[j].pos.y <= this.canvas.height) {
					available = false;
				}
			}
			if (available) {
				this.strands.push(new Strand(
					column * Char.width,
					this.canvas,
					this.ctx,
					this.charList,
					(this.randomColors) ? { 
						red: random(0, 255),
						green: random(0, 255),
						blue: random(0, 255)
					} : this.color
				));
			}
		}
		Entity.showAll(this.strands);
	}
}