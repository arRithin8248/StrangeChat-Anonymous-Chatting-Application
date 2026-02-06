import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const Home = () => {
    const { isAuthenticated } = useAuth();

    const features = [
        {
            icon: '🎭',
            title: 'Anonymous Identity',
            description: 'Chat with randomly assigned identities. No one knows who you really are.'
        },
        {
            icon: '⚡',
            title: 'Real-Time Chat',
            description: 'Instant messaging powered by WebSocket technology. No delays.'
        },
        {
            icon: '⏱️',
            title: 'Temporary Rooms',
            description: 'Create rooms that auto-delete. Your conversations vanish with time.'
        },
        {
            icon: '🔒',
            title: 'Privacy First',
            description: 'We never expose your real identity. Your data stays private.'
        },
        {
            icon: '💨',
            title: 'Self-Destructing Messages',
            description: 'Send messages that disappear after being read or after a set time.'
        },
        {
            icon: '🛡️',
            title: 'Secure & Moderated',
            description: 'Report abusive users while maintaining your anonymity.'
        }
    ];

    return (
        <div className="home">
            {/* Navigation */}
            <nav className="home-nav">
                <div className="nav-brand">
                    <span className="brand-icon">💬</span>
                    <span className="brand-name">StrangeChat</span>
                </div>
                <div className="nav-links">
                    {isAuthenticated ? (
                        <Link to="/chat" className="btn btn-primary">
                            Enter Chat
                        </Link>
                    ) : (
                        <>
                            <Link to="/login" className="btn btn-ghost">Login</Link>
                            <Link to="/register" className="btn btn-primary">Get Started</Link>
                        </>
                    )}
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero">
                <div className="hero-content">
                    <h1 className="hero-title">
                        Chat Freely.
                        <span className="gradient-text"> Stay Anonymous.</span>
                    </h1>
                    <p className="hero-subtitle">
                        Experience real-time anonymous conversations with complete privacy.
                        No personal data exposed. Ever.
                    </p>
                    <div className="hero-buttons">
                        {isAuthenticated ? (
                            <Link to="/chat" className="btn btn-primary btn-lg">
                                Enter Anonymous Chat
                            </Link>
                        ) : (
                            <>
                                <Link to="/register" className="btn btn-primary btn-lg">
                                    Start Chatting
                                </Link>
                                <Link to="/login" className="btn btn-secondary btn-lg">
                                    Login
                                </Link>
                            </>
                        )}
                    </div>
                </div>
                <div className="hero-visual">
                    <div className="chat-preview">
                        <div className="preview-message incoming">
                            <span className="preview-name">Ghost_247</span>
                            <span className="preview-text">Hey! Who's there? 👻</span>
                        </div>
                        <div className="preview-message outgoing">
                            <span className="preview-name">Shadow_589</span>
                            <span className="preview-text">Just another anonymous soul...</span>
                        </div>
                        <div className="preview-message incoming">
                            <span className="preview-name">Phantom_123</span>
                            <span className="preview-text">Welcome to the shadows! 🌙</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features">
                <h2 className="section-title">Why Choose StrangeChat?</h2>
                <div className="features-grid">
                    {features.map((feature, index) => (
                        <div key={index} className="feature-card" style={{ animationDelay: `${index * 0.1}s` }}>
                            <div className="feature-icon">{feature.icon}</div>
                            <h3 className="feature-title">{feature.title}</h3>
                            <p className="feature-description">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* How It Works */}
            <section className="how-it-works">
                <h2 className="section-title">How It Works</h2>
                <div className="steps">
                    <div className="step">
                        <div className="step-number">1</div>
                        <h3>Create Account</h3>
                        <p>Sign up with minimal info. We only need an email for access control.</p>
                    </div>
                    <div className="step">
                        <div className="step-number">2</div>
                        <h3>Get Anonymous</h3>
                        <p>Receive a random identity each time you enter a room.</p>
                    </div>
                    <div className="step">
                        <div className="step-number">3</div>
                        <h3>Chat Freely</h3>
                        <p>Express yourself without judgment. Your identity is protected.</p>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta">
                <div className="cta-content">
                    <h2>Ready to Chat Anonymously?</h2>
                    <p>Join thousands of users who value their privacy.</p>
                    {isAuthenticated ? (
                        <Link to="/chat" className="btn btn-primary btn-lg">
                            Enter Chat Now
                        </Link>
                    ) : (
                        <Link to="/register" className="btn btn-primary btn-lg">
                            Create Free Account
                        </Link>
                    )}
                </div>
            </section>

            {/* Footer */}
            <footer className="home-footer">
                <div className="footer-content">
                    <div className="footer-brand">
                        <span className="brand-icon">💬</span>
                        <span>StrangeChat</span>
                    </div>
                    <p className="footer-tagline">Privacy-First Anonymous Chat</p>
                    <p className="footer-copy">© 2024 StrangeChat. Your identity, your choice.</p>
                </div>
            </footer>
        </div>
    );
};

export default Home;
