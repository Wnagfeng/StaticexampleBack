const koa = require('koa');
const koaBody = require('koa-body').default;
const Router = require('koa-router');
const path = require('path');
const fs = require('fs'); // 使用 promises API
const cors = require('@koa/cors'); // 引入 @koa/cors 以处理跨域
const router = new Router();
const app = new koa();

// 允许跨域
app.use(cors({
    origin: '*', // 允许所有来源的请求, 你可以根据需要指定来源
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // 允许的HTTP方法
}));
// 使用 koaBody 处理文件上传
app.use(koaBody({
    multipart: true,
    formidable: {
        uploadDir: path.join(__dirname, 'public/uploads'), // 文件上传目录
        keepExtensions: true, // 保留文件扩展名
    }
}));

router.post('/upload', ctx => {
    const files = ctx.request.files; // 获取所有上传的文件

    const file = files.file; // 获取上传的文件
    if (!file) {
        ctx.status = 400;
        ctx.body = { message: '没有上传文件' };
        return;
    }

    // 使用 file.filepath 获取文件路径
    const basename = path.basename(file.filepath); // 获取文件名
    const fileUrl = `${ctx.origin}/uploads/${basename}`; // 返回文件 URL

    console.log(`文件上传成功: ${fileUrl}`); // 调试信息
    ctx.body = {
        code: 200,
        "url": fileUrl
    };
});


// 静态路由手动实现，通过路由返回文件
router.get('/uploads/:filename', async ctx => {
    const filePath = path.join(__dirname, 'public/uploads', ctx.params.filename);

    try {
        if (fs.existsSync(filePath)) {
            ctx.type = path.extname(filePath); // 设置文件类型
            ctx.body = fs.createReadStream(filePath); // 返回文件流
        } else {
            ctx.status = 404;
            ctx.body = { message: '文件未找到' };
        }
    } catch (err) {
        ctx.status = 500;
        ctx.body = { message: '读取文件时出错' };
    }
});

// 获取所有图片链接的路由
router.get('/imglist', async ctx => {
    const uploadDir = path.join(__dirname, 'public/uploads');
    try {
        // 确保目录存在
        await fs.promises.access(uploadDir);

        // 读取上传目录
        const files = await fs.promises.readdir(uploadDir);
        
        // 过滤图片文件
        const imageFiles = files.filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file));

        // 直接返回文件名
        ctx.body = { code: 200, images: imageFiles }; // 返回文件名数组
    } catch (err) {
        console.error('读取上传目录出错:', err); // 输出错误信息
        ctx.status = 500;
        ctx.body = { message: '无法读取上传目录' };
    }
});

app.use(router.routes());

app.listen(3001, () => {
    console.log('启动成功');
    console.log('http://localhost:3001');
});
