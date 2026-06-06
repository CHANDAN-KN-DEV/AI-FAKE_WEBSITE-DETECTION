import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from './App';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Home from '@/pages/Home';
import Check from '@/pages/Check';
import Result from '@/pages/Result';
import Dashboard from '@/pages/Dashboard';
import Community from '@/pages/Community';
import Leaderboard from '@/pages/Leaderboard';
import ExpertApply from '@/pages/ExpertApply';
import AdminReview from '@/pages/AdminReview';
import AuthorityDashboard from '@/pages/AuthorityDashboard';
import Profile from '@/pages/Profile';
import Notifications from '@/pages/Notifications';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <Navigate to="/login" replace />,
    },
    {
      path: '/login',
      element: <Login />,
    },
    {
      path: '/register',
      element: <Register />,
    },
    {
      path: '/',
      element: <App />,
      children: [
        { path: 'home', element: <ProtectedRoute><Home /></ProtectedRoute> },
        { path: 'check', element: <ProtectedRoute><Check /></ProtectedRoute> },
        { path: 'result/:claimId', element: <ProtectedRoute><Result /></ProtectedRoute> },
        { path: 'dashboard', element: <ProtectedRoute><Dashboard /></ProtectedRoute> },
        { path: 'community', element: <ProtectedRoute><Community /></ProtectedRoute> },
        { path: 'leaderboard', element: <ProtectedRoute><Leaderboard /></ProtectedRoute> },
        { path: 'expert-apply', element: <ProtectedRoute><ExpertApply /></ProtectedRoute> },
        { path: 'admin/review', element: <ProtectedRoute><AdminReview /></ProtectedRoute> },
        { path: 'authority/dashboard', element: <ProtectedRoute><AuthorityDashboard /></ProtectedRoute> },
        { path: 'profile', element: <ProtectedRoute><Profile /></ProtectedRoute> },
        { path: 'notifications', element: <ProtectedRoute><Notifications /></ProtectedRoute> },
      ],
    },
  ]
);


