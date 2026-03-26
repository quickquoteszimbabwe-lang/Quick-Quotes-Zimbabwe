import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import "@/lib/auth";

import Splash from "@/pages/Splash";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Home from "@/pages/Home";
import Jobs from "@/pages/Jobs";
import CreateJob from "@/pages/CreateJob";
import JobDetail from "@/pages/JobDetail";
import MyQuotes from "@/pages/MyQuotes";
import Payments from "@/pages/Payments";
import Profile from "@/pages/Profile";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function ProtectedRoute({ component: Component, roles }: { component: React.ComponentType; roles?: string[] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/" />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Redirect to="/home" />;
  }

  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/">
        {user ? <Redirect to="/home" /> : <Splash />}
      </Route>
      <Route path="/login">
        {user ? <Redirect to="/home" /> : <Login />}
      </Route>
      <Route path="/register">
        {user ? <Redirect to="/home" /> : <Register />}
      </Route>
      <Route path="/home">
        <ProtectedRoute component={Home} />
      </Route>
      <Route path="/jobs/create">
        <ProtectedRoute component={CreateJob} roles={["customer"]} />
      </Route>
      <Route path="/jobs/:id">
        <ProtectedRoute component={JobDetail} />
      </Route>
      <Route path="/jobs">
        <ProtectedRoute component={Jobs} />
      </Route>
      <Route path="/quotes">
        <ProtectedRoute component={MyQuotes} roles={["professional"]} />
      </Route>
      <Route path="/payments">
        <ProtectedRoute component={Payments} />
      </Route>
      <Route path="/profile">
        <ProtectedRoute component={Profile} />
      </Route>
      <Route path="/admin">
        <ProtectedRoute component={Admin} roles={["admin"]} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AppRoutes />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
