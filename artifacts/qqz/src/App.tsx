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
import Requests from "@/pages/Requests";
import RequestDetail from "@/pages/RequestDetail";
import CreateRequest from "@/pages/CreateRequest";
import Services from "@/pages/Services";
import MyOffers from "@/pages/MyOffers";
import Payments from "@/pages/Payments";
import Profile from "@/pages/Profile";
import Verify from "@/pages/Verify";
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
      <Route path="/services">
        <ProtectedRoute component={Services} />
      </Route>

      {/* Primary routes — new marketplace terminology */}
      <Route path="/requests/create">
        <ProtectedRoute component={CreateRequest} roles={["customer"]} />
      </Route>
      <Route path="/requests/:id">
        <ProtectedRoute component={RequestDetail} />
      </Route>
      <Route path="/requests">
        <ProtectedRoute component={Requests} />
      </Route>
      <Route path="/offers">
        <ProtectedRoute component={MyOffers} roles={["professional"]} />
      </Route>

      {/* Legacy redirects — keep old /jobs URLs working */}
      <Route path="/jobs/create">
        <Redirect to="/requests/create" />
      </Route>
      <Route path="/jobs/:id">
        {(params) => <Redirect to={`/requests/${params.id}`} />}
      </Route>
      <Route path="/jobs">
        <Redirect to="/requests" />
      </Route>
      <Route path="/quotes">
        <Redirect to="/offers" />
      </Route>

      <Route path="/payments">
        <ProtectedRoute component={Payments} />
      </Route>
      <Route path="/profile">
        <ProtectedRoute component={Profile} />
      </Route>
      <Route path="/verify">
        <ProtectedRoute component={Verify} />
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
