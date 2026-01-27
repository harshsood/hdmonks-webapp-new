import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api/admin`;

const BlogManagement = () => {
  const [blogs, setBlogs] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [formData, setFormData] = useState({
    title: '', slug: '', excerpt: '', content: '', author: '', category: '', tags: [], published: false
  });

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/blogs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBlogs(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load blogs');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('admin_token');
      if (editingBlog) {
        await axios.put(`${API}/blogs/${editingBlog.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Blog updated');
      } else {
        await axios.post(`${API}/blogs`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Blog created');
      }
      setIsModalOpen(false);
      fetchBlogs();
      resetForm();
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this blog?')) return;
    try {
      const token = localStorage.getItem('admin_token');
      await axios.delete(`${API}/blogs/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Blog deleted');
      fetchBlogs();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const resetForm = () => {
    setEditingBlog(null);
    setFormData({ title: '', slug: '', excerpt: '', content: '', author: '', category: '', tags: [], published: false });
  };

  const openEditModal = (blog) => {
    setEditingBlog(blog);
    setFormData({
      title: blog.title,
      slug: blog.slug,
      excerpt: blog.excerpt,
      content: blog.content,
      author: blog.author,
      category: blog.category,
      tags: blog.tags || [],
      published: blog.published
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h1 className="text-3xl font-bold">Blog Management</h1>
        <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="bg-orange-500">
          <Plus className="h-5 w-5 mr-2" />New Blog Post
        </Button>
      </div>

      <div className="grid gap-4">
        {blogs.map(blog => (
          <Card key={blog.id} className="p-6">
            <div className="flex justify-between">
              <div>
                <h3 className="text-xl font-semibold mb-2">{blog.title}</h3>
                <p className="text-gray-600 mb-2">{blog.excerpt}</p>
                <div className="flex gap-2 text-sm text-gray-500">
                  <span>By {blog.author}</span>
                  <span>•</span>
                  <span>{blog.category}</span>
                  <span>•</span>
                  <span className={blog.published ? 'text-green-600' : 'text-yellow-600'}>
                    {blog.published ? 'Published' : 'Draft'}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openEditModal(blog)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleDelete(blog.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingBlog ? 'Edit Blog' : 'New Blog Post'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" placeholder="Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-3 py-2 border rounded-lg" required />
            <input type="text" placeholder="URL Slug" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} className="w-full px-3 py-2 border rounded-lg" required />
            <textarea placeholder="Excerpt" value={formData.excerpt} onChange={e => setFormData({...formData, excerpt: e.target.value})} className="w-full px-3 py-2 border rounded-lg" rows="2" required />
            <div>
              <label className="block text-sm font-medium mb-2">Content</label>
              <ReactQuill value={formData.content} onChange={content => setFormData({...formData, content})} className="bg-white" />
            </div>
            <input type="text" placeholder="Author" value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} className="w-full px-3 py-2 border rounded-lg" required />
            <input type="text" placeholder="Category" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-3 py-2 border rounded-lg" required />
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={formData.published} onChange={e => setFormData({...formData, published: e.target.checked})} />
              <span>Publish immediately</span>
            </label>
            <Button type="submit" className="w-full bg-orange-500">{editingBlog ? 'Update' : 'Create'} Blog Post</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BlogManagement;
