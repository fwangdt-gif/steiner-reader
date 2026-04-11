import { redirect } from 'next/navigation'

// 书籍管理 = 管理员模式下的「我的图书管理」页面
// my-books/page.tsx 已经处理 isAdmin 逻辑，直接复用
export default function AdminBooksPage() {
  redirect('/my-books')
}
