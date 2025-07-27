// Supabase Authentication Client for Zentro Homes Admin Panel
class SupabaseAuth {
    constructor() {
        // Initialize Supabase client (you'll need to get these from your Supabase project)
        this.supabaseUrl = 'YOUR_SUPABASE_URL'; // Replace with your Supabase URL
        this.supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'; // Replace with your Supabase anon key
        
        // Initialize Supabase client
        this.supabase = window.supabase.createClient(this.supabaseUrl, this.supabaseAnonKey);
        
        this.currentUser = null;
        this.isAuthenticated = false;
        this.authToken = null;
        
        // Initialize authentication state
        this.initAuth();
    }

    async initAuth() {
        try {
            // Get current session
            const { data: { session }, error } = await this.supabase.auth.getSession();
            
            if (error) {
                console.error('Error getting session:', error);
                return;
            }

            if (session?.user) {
                this.currentUser = session.user;
                this.authToken = session.access_token;
                this.isAuthenticated = true;
                
                // Check if user has admin role
                if (session.user.user_metadata?.role !== 'admin') {
                    console.warn('User does not have admin role');
                    this.signOut();
                    return;
                }
                
                this.updateUI();
            }

            // Listen for auth changes
            this.supabase.auth.onAuthStateChange((event, session) => {
                console.log('Auth state changed:', event);
                
                if (event === 'SIGNED_IN' && session?.user) {
                    this.currentUser = session.user;
                    this.authToken = session.access_token;
                    this.isAuthenticated = true;
                    
                    // Check admin role
                    if (session.user.user_metadata?.role !== 'admin') {
                        console.warn('User does not have admin role');
                        this.signOut();
                        return;
                    }
                    
                    this.updateUI();
                } else if (event === 'SIGNED_OUT') {
                    this.currentUser = null;
                    this.authToken = null;
                    this.isAuthenticated = false;
                    this.updateUI();
                }
            });

        } catch (error) {
            console.error('Auth initialization error:', error);
        }
    }

    async signIn(email, password) {
        try {
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                throw error;
            }

            // Check if user has admin role
            if (data.user?.user_metadata?.role !== 'admin') {
                await this.signOut();
                throw new Error('Access denied. Admin privileges required.');
            }

            return { success: true, user: data.user };

        } catch (error) {
            console.error('Sign in error:', error);
            return { success: false, error: error.message };
        }
    }

    async signUp(email, password, userData = {}) {
        try {
            const { data, error } = await this.supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        ...userData,
                        role: 'admin' // Set admin role for new users
                    }
                }
            });

            if (error) {
                throw error;
            }

            return { success: true, user: data.user };

        } catch (error) {
            console.error('Sign up error:', error);
            return { success: false, error: error.message };
        }
    }

    async signOut() {
        try {
            const { error } = await this.supabase.auth.signOut();
            
            if (error) {
                throw error;
            }

            this.currentUser = null;
            this.authToken = null;
            this.isAuthenticated = false;
            this.updateUI();

            return { success: true };

        } catch (error) {
            console.error('Sign out error:', error);
            return { success: false, error: error.message };
        }
    }

    async resetPassword(email) {
        try {
            const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/admin/reset-password.html`
            });

            if (error) {
                throw error;
            }

            return { success: true };

        } catch (error) {
            console.error('Password reset error:', error);
            return { success: false, error: error.message };
        }
    }

    async updatePassword(newPassword) {
        try {
            const { error } = await this.supabase.auth.updateUser({
                password: newPassword
            });

            if (error) {
                throw error;
            }

            return { success: true };

        } catch (error) {
            console.error('Password update error:', error);
            return { success: false, error: error.message };
        }
    }

    getAuthToken() {
        return this.authToken;
    }

    getUser() {
        return this.currentUser;
    }

    isUserAuthenticated() {
        return this.isAuthenticated;
    }

    updateUI() {
        // Update UI elements based on authentication state
        const signInForm = document.getElementById('signInForm');
        const adminPanel = document.getElementById('adminPanel');
        const userInfo = document.getElementById('userInfo');
        const signOutBtn = document.getElementById('signOutBtn');

        if (this.isAuthenticated) {
            // Show admin panel, hide sign-in form
            if (signInForm) signInForm.style.display = 'none';
            if (adminPanel) adminPanel.style.display = 'block';
            
            // Update user info
            if (userInfo && this.currentUser) {
                const userName = this.currentUser.user_metadata?.name || 
                               this.currentUser.user_metadata?.first_name || 
                               this.currentUser.email?.split('@')[0] || 
                               'Admin User';
                userInfo.textContent = `Welcome, ${userName}`;
            }

            // Show sign out button
            if (signOutBtn) {
                signOutBtn.style.display = 'block';
                signOutBtn.onclick = () => this.signOut();
            }

        } else {
            // Show sign-in form, hide admin panel
            if (signInForm) signInForm.style.display = 'block';
            if (adminPanel) adminPanel.style.display = 'none';
            if (userInfo) userInfo.textContent = '';
            if (signOutBtn) signOutBtn.style.display = 'none';
        }

        // Trigger custom event for other components
        window.dispatchEvent(new CustomEvent('authStateChanged', {
            detail: {
                isAuthenticated: this.isAuthenticated,
                user: this.currentUser,
                token: this.authToken
            }
        }));
    }

    // Helper method to make authenticated API requests
    async makeAuthenticatedRequest(url, options = {}) {
        if (!this.authToken) {
            throw new Error('No authentication token available');
        }

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.authToken}`,
            ...options.headers
        };

        const response = await fetch(url, {
            ...options,
            headers
        });

        if (response.status === 401) {
            // Token expired or invalid, sign out
            this.signOut();
            throw new Error('Authentication expired. Please sign in again.');
        }

        return response;
    }
}

// Initialize global auth instance
window.supabaseAuth = new SupabaseAuth();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SupabaseAuth;
}