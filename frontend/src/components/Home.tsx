import React from 'react';

const Home: React.FC = () => {
  return (
    <div className="home-root">
      <header className="home-nav">
        <div className="home-logo">
          <div className="home-mark">L</div>
          <div>
            <div className="home-brand">LIMS</div>
            <div className="home-tagline">Laboratory Information Management System</div>
          </div>
        </div>
        <div className="home-nav-actions">
          <a className="home-link" href="/login">Log in</a>
          <a className="home-button primary" href="/signup">Create account</a>
        </div>
      </header>

      <section className="home-hero">
        <div className="home-hero-left">
          <div className="home-eyebrow">Trusted clinical operations, simplified</div>
          <h1 className="home-title">
            LIMS unifies labs, doctors, and patients into one secure, real-time workflow.
          </h1>
          <p className="home-subtitle">
            A modern LIMS platform built for faster diagnostics, cleaner audit trails,
            and reliable patient outcomes. Track requests, results, and case history in one place.
          </p>
          <div className="home-cta-row">
            <a className="home-button primary" href="/signup">Get started</a>
            <a className="home-button ghost" href="/login">Log in</a>
          </div>
          <div className="home-microcopy">
            HIPAA-style audit logs, role-based access, and secure storage included.
          </div>
        </div>
        <div className="home-hero-right">
          <div className="home-stat-grid">
            <div className="home-stat-card">
              <div className="home-stat-title">Turnaround</div>
              <div className="home-stat-value">-32%</div>
              <div className="home-stat-note">Lab processing time</div>
            </div>
            <div className="home-stat-card accent">
              <div className="home-stat-title">Accuracy</div>
              <div className="home-stat-value">99.2%</div>
              <div className="home-stat-note">Result validation</div>
            </div>
            <div className="home-stat-card">
              <div className="home-stat-title">Traceability</div>
              <div className="home-stat-value">Full</div>
              <div className="home-stat-note">Case timeline</div>
            </div>
            <div className="home-stat-card accent">
              <div className="home-stat-title">Uptime</div>
              <div className="home-stat-value">99.9%</div>
              <div className="home-stat-note">Operational stability</div>
            </div>
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="home-section-head">
          <h2 className="home-section-title">Role-first experience</h2>
          <p className="home-section-subtitle">
            Every user sees exactly what they need. Clear ownership, clean handoffs, zero noise.
          </p>
        </div>

        <div className="home-role-grid">
          <div className="home-role-card">
            <div className="home-role-icon">P</div>
            <h3>Patient</h3>
            <p>Book appointments, view reports, track case updates, and stay informed.</p>
            <a className="home-button subtle" href="/signup">Join as patient</a>
          </div>
          <div className="home-role-card">
            <div className="home-role-icon">D</div>
            <h3>Doctor</h3>
            <p>Create cases, prescribe treatment, request labs, and follow up on recovery.</p>
            <a className="home-button subtle" href="/signup">Join as doctor</a>
          </div>
          <div className="home-role-card">
            <div className="home-role-icon">L</div>
            <h3>Laboratory</h3>
            <p>Manage requests, track samples, upload results, and notify stakeholders.</p>
            <a className="home-button subtle" href="/signup">Join as lab</a>
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="home-section-head">
          <h2 className="home-section-title">Subscriptions for clinical teams</h2>
          <p className="home-section-subtitle">
            Doctors and labs get advanced analytics, priority support, and compliance exports.
          </p>
        </div>

        <div className="home-plan-grid">
          <div className="home-plan-card">
            <div className="home-plan-header">
              <h3>Doctor Pro</h3>
              <div className="home-plan-price">Starting from INR 400 / month</div>
            </div>
            <ul className="home-plan-list">
              <li>Case timelines with audit trails</li>
              <li>Smart follow-up scheduling</li>
              <li>Prescription templates and exports</li>
              <li>Priority clinical support</li>
            </ul>
            <a className="home-button primary" href="/signup">Start Doctor Pro</a>
          </div>

          <div className="home-plan-card highlight">
            <div className="home-plan-header">
              <h3>Lab Plus</h3>
              <div className="home-plan-price">INR 500 / month</div>
            </div>
            <ul className="home-plan-list">
              <li>Sample lifecycle automation</li>
              <li>Turnaround time analytics</li>
              <li>Compliance-ready reporting</li>
              <li>Dedicated lab success manager</li>
            </ul>
            <a className="home-button primary" href="/signup">Start Lab Plus</a>
          </div>
        </div>
      </section>

      <section className="home-footer">
        <div>
          <div className="home-footer-title">Ready to modernize your care workflow?</div>
          <div className="home-footer-sub">Get started in minutes or talk to our team.</div>
        </div>
        <div className="home-cta-row">
          <a className="home-button primary" href="/signup">Create account</a>
          <a className="home-button ghost" href="/login">Log in</a>
        </div>
      </section>
    </div>
  );
};

export default Home;
