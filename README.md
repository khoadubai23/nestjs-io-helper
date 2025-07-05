# NestJS IO Helper

Một thư viện helper cho NestJS giúp đơn giản hóa việc xử lý input/output và các tác vụ thường gặp.

## Cài đặt

```bash
npm install nestjs-io-helper
```

## Sử dụng

```typescript
import { IoHelper } from 'nestjs-io-helper';

// Sử dụng các helper functions
const result = IoHelper.validateInput(data);
```

## Tính năng

- Input validation helpers
- Output formatting utilities
- Error handling helpers
- Common NestJS utilities

## API Reference

### IoHelper

#### validateInput(data: any): boolean
Kiểm tra và validate input data

#### formatOutput(data: any): any
Format output data theo chuẩn

#### handleError(error: Error): ErrorResponse
Xử lý lỗi và trả về response chuẩn

## License

MIT

## Contributing

1. Fork repository
2. Tạo feature branch
3. Commit changes
4. Push to branch
5. Tạo Pull Request 