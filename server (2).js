require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// 获取任务列表，支持优先级筛选、创建时间倒序
app.get('/api/tasks', async (req, res) => {
  const { priority } = req.query;
  let query = supabase.from('tasks').select('*').order('created_at', { ascending: false });
  if (priority && priority !== '全部') {
    query = query.eq('priority', priority);
  }
  const { data, error } = await query;
  if (error) {
    console.error('查询失败：', error);
    return res.status(500).json({ error });
  }
  res.json(data);
});

// 添加任务
app.post('/api/tasks', async (req, res) => {
  const { title, priority } = req.body;
  const { data, error } = await supabase.from('tasks').insert([{ title, priority }]).select();
  if (error) {
    console.error('新增失败：', error);
    return res.status(500).json({ error });
  }
  res.json(data[0]);
});

// 切换完成状态
app.patch('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { completed } = req.body;
  const { data, error } = await supabase.from('tasks').update({ completed }).eq('id', id).select();
  if (error) {
    console.error('更新失败：', error);
    return res.status(500).json({ error });
  }
  res.json(data[0]);
});

// 删除任务
app.delete('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) {
    console.error('删除失败：', error);
    return res.status(500).json({ success: false, error });
  }
  res.json({ success: true });
});

// ✅ 关键：根路由直接返回html，绕过 express.static
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// 本地启动用，Vercel不会执行listen
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`本地运行：http://localhost:${PORT}`);
});

// Vercel serverless 导出
module.exports = app;
