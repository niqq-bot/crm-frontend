import React, { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowDownToLine, ArrowLeftRight, Bell, BriefcaseBusiness, Building2, Check, ChevronDown, CircleHelp, ClipboardList, ContactRound, FileJson, Gauge, KeyRound, LayoutDashboard, LogOut, Mail, Menu, Plus, RefreshCw, Search, Send, Settings, ShieldCheck, Trash2, UserRound, Users, X, Zap } from 'lucide-react';
import { api, getBase, getToken, normalizeList, pretty, setBase, setToken } from './api';

const NAV = [
  { group:'Workspace', items:[['Dashboard','dashboard',Gauge],['Leads','leads',Zap],['Contacts','contacts',ContactRound],['Deals','deals',BriefcaseBusiness],['Tasks','tasks',ClipboardList]] },
  { group:'Manage', items:[['Organizations','organizations',Building2],['Users','users',Users],['Invitations','invites',Mail],['Watchlist','watchlist',ShieldCheck],['Activity timeline','activity',Activity]] },
  { group:'System', items:[['API Console','console',FileJson],['API Settings','settings',Settings]] }
];
const labelize = (s='') => String(s).replace(/([a-z])([A-Z])/g,'$1 $2').replace(/[_-]/g,' ').replace(/^./,c=>c.toUpperCase());
const humanDate = (v) => { if(!v) return '—'; const d=new Date(v); return Number.isNaN(d.getTime())?String(v):d.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}); };
const initials = (s='CRM User') => s.split(/[\s@._-]+/).filter(Boolean).slice(0,2).map(x=>x[0]?.toUpperCase()).join('') || 'U';
const statusTone = (s='') => { const x=String(s).toLowerCase(); if(x.includes('won')||x.includes('complete')||x.includes('active')||x==='qualified'||x==='converted') return 'green'; if(x.includes('lost')||x.includes('deferred')||x.includes('inactive')||x.includes('hot')) return 'red'; if(x.includes('progress')||x.includes('contacted')||x.includes('proposal')||x.includes('warm')) return 'blue'; return 'amber'; };
const leadDefaults={ownerId:'',title:'',firstName:'',lastName:'',company:'',email:'',secondaryEmail:'',phone:'',mobile:'',website:'',annualRevenue:'',employeeCount:'',street:'',city:'',state:'',postalCode:'',country:'',description:'',industry:'SOFTWARE',leadStatus:'NEW',leadSource:'WEBSITE',rating:'WARM',emailOptOut:false};
const contactDefaults={name:'',email:'',secondaryEmail:'',phoneNumber:'',description:'',note:'',title:'',department:'',contactSource:'WEBSITE',country:'',city:'',state:''};
const dealDefaults={dealName:'',amount:'',expectedRevenue:'',stage:'QUALIFICATION',type:'NEW_BUSINESS',probability:20,nextStep:'',leadSource:'WEBSITE',campaignSource:'',closingDate:'',description:'',contactId:''};
const taskDefaults={subject:'',description:'',status:'NOT_STARTED',priority:'NORMAL',dueDate:'',reminderAt:'',sendNotificationEmail:false,recurringActivity:false,ownerId:'',relatedContactId:'',relatedLeadId:''};
const leadEnums={industry:['SOFTWARE','FINANCE','HEALTHCARE','EDUCATION','RETAIL','MANUFACTURING','OTHER'],leadStatus:['NEW','CONTACTED','QUALIFIED','LOST','CONVERTED'],leadSource:['WEBSITE','REFERRAL','SOCIAL_MEDIA','EMAIL_CAMPAIGN','COLD_CALL','EVENT','GOOGLE_ADS','ORGANIC_SEARCH','PARTNER','OTHER'],rating:['HOT','WARM','COLD']};
const dealEnums={stage:['QUALIFICATION','NEEDS_ANALYSIS','VALUE_PROPOSITION','IDENTIFY_DECISION_MAKERS','PROPOSAL_PRICE_QUOTE','NEGOTIATION_REVIEW','CLOSED_WON','CLOSED_LOST'],type:['NEW_BUSINESS','EXISTING_BUSINESS','RENEWAL','UPSELL','CROSS_SELL'],leadSource:leadEnums.leadSource};
const taskEnums={status:['NOT_STARTED','IN_PROGRESS','WAITING_FOR_INPUT','COMPLETED','DEFERRED'],priority:['LOWEST','LOW','NORMAL','HIGH','HIGHEST']};

function App() {
  const [page, setPage] = useState('dashboard');
  const [token, setTokenState] = useState(getToken());
  const [me, setMe] = useState(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [toast, setToast] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const [search, setSearch] = useState('');
  const [checkingOrg, setCheckingOrg] = useState(true);

  const notify = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4200);
  };

  const logout = () => {
    setToken('');
    setTokenState('');
    setMe(null);
    setPage('login');
    notify('Signed out', 'success');
  };

  // Fetch the current user whenever the authentication token changes.
  useEffect(() => {
    if (!token) {
      setMe(null);
      setCheckingOrg(false);
      return;
    }

    setCheckingOrg(true);

    api('/auth/me')
      .then(response => {
        const user =
          response?.user ??
          response?.data?.user ??
          response?.data ??
          response;

        setMe(user);
      })
      .catch(() => {
        setMe(null);
      })
      .finally(() => {
        setCheckingOrg(false);
      });
  }, [token]);

  // Show the authentication screen if the user is logged out.
  if (
    !token &&
    !['login', 'register', 'forgot', 'inviteRegister'].includes(page)
  ) {
    return (
      <AuthScreen
        mode="login"
        setPage={setPage}
        onAuth={(t, u) => {
          setToken(t);
          setTokenState(t);
          setMe(u);
          setCheckingOrg(true);
          setPage('dashboard');
          notify('Welcome to Logic-Q1 CRM');
        }}
        notify={notify}
      />
    );
  }

  // Show the selected authentication page.
  if (['login', 'register', 'forgot', 'inviteRegister'].includes(page)) {
    return (
      <AuthScreen
        mode={page}
        setPage={setPage}
        onAuth={(t, u) => {
          setToken(t);
          setTokenState(t);
          setMe(u);
          setCheckingOrg(true);
          setPage('dashboard');
          notify('You are signed in');
        }}
        notify={notify}
      />
    );
  }

  // Wait until the current user's organisation status is known.
  if (token && checkingOrg) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: '#f7f8fc',
          color: '#202944'
        }}
      >
        Checking your organisation...
      </div>
    );
  }

  // If the user has no organisation, show ONLY the creation screen.
  if (token && me && me.orgId == null) {
    return (
      <CreateOrganizationGate
        onCreated={async () => {
          setCheckingOrg(true);

          try {
            const response = await api('/auth/me');

            const user =
              response?.user ??
              response?.data?.user ??
              response?.data ??
              response;

            setMe(user);
            setPage('dashboard');
          } catch (error) {
            notify(
              'Organisation created, but refreshing your user details failed. Please refresh the page.',
              'error'
            );
          } finally {
            setCheckingOrg(false);
          }
        }}
      />
    );
  }

  // Keep the original CRM homepage and navigation.
  const title =
    NAV.flatMap(group => group.items).find(item => item[1] === page)?.[0] ||
    ({
      login: 'Welcome back',
      register: 'Create account',
      forgot: 'Reset password',
      inviteRegister: 'Accept invitation'
    }[page] || 'Logic-Q1 CRM');

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">
            <Zap size={20} fill="currentColor" />
          </div>

          <div>
            <b>
              logic<span>Q1</span>
            </b>
            <small>CRM WORKSPACE</small>
          </div>

          <button
            className="icon-btn mobile-close"
            onClick={() => setMobileNav(false)}
          >
            <X size={18} />
          </button>
        </div>

        <div className="workspace-pill">
          <div className="workspace-avatar">L</div>
          <div>
            <b>Logic-Q1</b>
            <small>Workspace</small>
          </div>
          <ChevronDown size={15} />
        </div>

        <nav>
          {NAV.map(group => (
            <div className="nav-group" key={group.group}>
              <div className="nav-label">{group.group}</div>

              {group.items.map(([name, id, Icon]) => (
                <button
                  key={id}
                  className={`nav-item ${page === id ? 'active' : ''}`}
                  onClick={() => {
                    setPage(id);
                    setMobileNav(false);
                    setSearch('');
                  }}
                >
                  <Icon size={17} />
                  <span>{name}</span>
                  {id === 'activity' && <span className="nav-dot" />}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon">
              <CircleHelp size={17} />
            </div>
            <b>Need a hand?</b>
            <p>Manage your API connection and auth settings.</p>
            <button onClick={() => setPage('settings')}>
              Open settings <span>↗</span>
            </button>
          </div>

          <div className="profile-mini">
            <div className="avatar">
              {initials(me?.firstName || me?.email || 'User')}
            </div>

            <div className="profile-copy">
              <b>
                {me?.firstName
                  ? `${me.firstName} ${me.lastName || ''}`
                  : me?.email || 'CRM User'}
              </b>
              <small>{me?.email || 'Signed in'}</small>
            </div>

            <button
              className="icon-btn"
              title="Sign out"
              onClick={logout}
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      {mobileNav && (
        <div
          className="scrim"
          onClick={() => setMobileNav(false)}
        />
      )}

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-btn mobile-menu"
              onClick={() => setMobileNav(true)}
            >
              <Menu size={20} />
            </button>

            <div className="breadcrumbs">
              <span>Workspace</span>
              <span className="crumb-slash">/</span>
              <b>{title}</b>
            </div>
          </div>

          <div className="topbar-right">
            <div className="global-search">
              <Search size={16} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search this view..."
              />
              <kbd>⌘ K</kbd>
            </div>

            <button
              className="icon-btn bell-btn"
              title="Refresh data"
              onClick={() => setRefresh(v => v + 1)}
            >
              <RefreshCw size={17} />
            </button>

            <div className="top-avatar">
              {initials(me?.firstName || me?.email || 'User')}
            </div>
          </div>
        </header>

        <div className="page-wrap">
          <PageRouter
            page={page}
            setPage={setPage}
            refresh={refresh}
            search={search}
            notify={notify}
            me={me}
            logout={logout}
          />
        </div>

        <footer className="footer">
          <span>© 2026 Logic-Q1 CRM</span>

          <span>
            <i className="live-dot" /> API connected interface
            <span className="footer-divider">·</span>
            <button onClick={() => setPage('console')}>
              Developer console
            </button>
          </span>
        </footer>
      </main>

      {toast && (
        <div className={`toast ${toast.type}`}>
          <span className="toast-icon">
            {toast.type === 'error' ? '!' : '✓'}
          </span>

          {toast.message}

          <button onClick={() => setToast(null)}>
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
function CreateOrganizationGate({ onCreated }) {
  const [form, setForm] = useState({
    name: '',
    category: '',
    country: '',
    websiteUrl: ''
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const update = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const create = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');

    try {
      await api('/organization/create', {
        method: 'POST',
        body: form
      });

      await onCreated();
    } catch (err) {
      setError(err.message || 'Could not create organisation.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      placeItems: 'center',
      padding: 20,
      background: '#f7f8fc'
    }}>
      <div style={{
        width: '100%',
        maxWidth: 440,
        padding: 30,
        boxSizing: 'border-box',
        background: '#fff',
        border: '1px solid #e7e9f2',
        borderRadius: 18
      }}>
        <Building2 size={32} color="#6558f5" />

        <h2>You are not part of any organisation</h2>
        <p>Create one to get started. You can access your CRM after creation.</p>

        <form onSubmit={create}>
          <div className="form-stack">
            <Field
              label="Organisation name"
              value={form.name}
              onChange={v => update('name', v)}
              required
            />

            <Field
              label="Category"
              value={form.category}
              onChange={v => update('category', v)}
              required
            />

            <Field
              label="Country"
              value={form.country}
              onChange={v => update('country', v)}
              required
            />

            <Field
              label="Website URL"
              type="url"
              value={form.websiteUrl}
              onChange={v => update('websiteUrl', v)}
            />

            {error && <p style={{ color: '#b42318' }}>{error}</p>}

            <button type="submit" disabled={busy}>
              {busy ? 'Creating...' : 'Create organisation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AuthScreen({mode,setPage,onAuth,notify}){
 const [form,setForm]=useState({firstName:'',lastName:'',email:'',password:'',repeatPassword:'',emailForReset:'',otp:'',token:new URLSearchParams(location.search).get('token')||''}); const [busy,setBusy]=useState(false); const [error,setError]=useState('');
 const update=(k,v)=>setForm(p=>({...p,[k]:v}));
 const submit=async(e)=>{e.preventDefault();setBusy(true);setError('');try{
  if(mode==='login'){const r=await api('/auth/login',{method:'POST',body:{email:form.email,password:form.password}});const t=r?.token||r?.accessToken||r?.data?.token;if(!t)throw new Error('Login succeeded but no token was found in the response. Set it manually in API Settings.');onAuth(t,r?.user||r?.data?.user||null);}
  else if(mode==='register'){const r=await api('/auth/register',{method:'POST',body:{firstName:form.firstName,lastName:form.lastName,email:form.email,password:form.password}});const t=r?.token||r?.data?.token;if(t)onAuth(t,r?.user||r?.data?.user);else {notify(r?.message||'Account created. Please sign in.');setPage('login');}}
  else if(mode==='forgot'){if(form.otp){const r=await api(`/auth/forgotPassword/verifyOTP/${encodeURIComponent(form.emailForReset)}/${encodeURIComponent(form.otp)}`,{method:'POST'});notify(pretty(r));}else {const r=await api(`/auth/forgotPassword/verifyMail/${encodeURIComponent(form.emailForReset)}`,{method:'POST'});notify(pretty(r));}}
  else if(mode==='inviteRegister'){const r=await api('/auth/register-invite',{method:'POST',body:{token:form.token,firstName:form.firstName,lastName:form.lastName,password:form.password}});notify(pretty(r));setPage('login');}
 }catch(e){setError(e.message)}finally{setBusy(false)}};
 const heading=mode==='register'?'Create your account':mode==='forgot'?'Reset your password':mode==='inviteRegister'?'Join your organization':'Welcome back';
 return <div className="auth-layout"><div className="auth-art"><div className="auth-brand"><div className="brand-mark"><Zap size={20} fill="currentColor"/></div><b>logic<span>Q1</span></b></div><div className="art-copy"><div className="eyebrow"><span className="live-dot"/> YOUR CUSTOMER OPERATING SYSTEM</div><h1>Relationships<br/>that move <em>business</em><br/>forward.</h1><p>One connected space for your leads, deals, people, and the next big thing.</p><div className="art-metrics"><div><b>01</b><span>Capture leads</span></div><div><b>02</b><span>Build trust</span></div><div><b>03</b><span>Close deals</span></div></div></div><div className="art-footer"><span>LOGIC-Q1 CRM</span><span>Built for momentum ↗</span></div><div className="art-orb orb-one"/><div className="art-orb orb-two"/></div><div className="auth-panel"><div className="auth-mobile-brand"><div className="brand-mark"><Zap size={20}/></div><b>logic<span>Q1</span></b></div><div className="auth-form-wrap"><div className="auth-overline">{mode==='login'?'SIGN IN TO YOUR WORKSPACE':'GET STARTED'}</div><h2>{heading}</h2><p className="auth-sub">{mode==='login'?'Enter your details to access your workspace.':mode==='forgot'?'Verify your email and OTP to continue.':'A few details and you’ll be ready to go.'}</p><form onSubmit={submit} className="auth-form">
 {['register','inviteRegister'].includes(mode)&&<div className="form-row"><Field label="First name" value={form.firstName} onChange={v=>update('firstName',v)} required/><Field label="Last name" value={form.lastName} onChange={v=>update('lastName',v)} required/></div>}
 {mode==='inviteRegister'&&<Field label="Invitation token" value={form.token} onChange={v=>update('token',v)} required/>}
 {mode==='forgot'?<><Field label="Email address" type="email" value={form.emailForReset} onChange={v=>update('emailForReset',v)} required/><Field label="OTP (after requesting email verification)" value={form.otp} onChange={v=>update('otp',v)}/></>:<><Field label="Email address" type="email" value={form.email} onChange={v=>update('email',v)} required/><Field label="Password" type="password" value={form.password} onChange={v=>update('password',v)} required/></>}
 {error&&<div className="inline-error">{error}</div>}<button className="btn btn-primary auth-submit" disabled={busy}>{busy?'Please wait…':mode==='login'?'Sign in':mode==='register'?'Create account':mode==='forgot'?(form.otp?'Verify OTP':'Send verification email'):'Accept invitation'} <span>→</span></button>
 </form>{mode==='login'&&<button className="text-link centered" onClick={()=>setPage('forgot')}>Forgot password?</button>}{mode==='login'?<p className="auth-switch">New to Logic-Q1? <button onClick={()=>setPage('register')}>Create an account</button></p>:<p className="auth-switch">Already have an account? <button onClick={()=>setPage('login')}>Sign in</button></p>}<div className="auth-legal"><ShieldCheck size={14}/> Your workspace is protected by secure authentication.</div></div></div></div>
}

function Field({label,value,onChange,type='text',required=false,placeholder='',options,textarea=false,wide=false}){return <label className={`field ${wide?'field-wide':''}`}><span>{label}{required&&<i> *</i>}</span>{options?<select value={value??''} required={required} onChange={e=>onChange(e.target.value)}><option value="">Select {label.toLowerCase()}</option>{options.map(o=><option key={o} value={o}>{labelize(o)}</option>)}</select>:textarea?<textarea value={value??''} required={required} placeholder={placeholder} onChange={e=>onChange(e.target.value)} rows={3}/>:<input type={type} value={value??''} required={required} placeholder={placeholder} onChange={e=>onChange(e.target.value)}/>}</label>}
function ToggleField({label,value,onChange}){return <label className="toggle-field"><span>{label}</span><button type="button" className={`toggle ${value?'on':''}`} onClick={()=>onChange(!value)}><i/></button></label>}
function Modal({title,children,onClose,wide=false}){return <div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><div className={`modal ${wide?'modal-wide':''}`}><div className="modal-head"><div><div className="eyebrow">WORKSPACE</div><h3>{title}</h3></div><button className="icon-btn" onClick={onClose}><X size={19}/></button></div>{children}</div></div>}
function PageHeader({eyebrow,title,subtitle,action,actionLabel='Create new',icon:Icon=Plus}){return <div className="page-heading"><div><div className="eyebrow">{eyebrow||'YOUR WORKSPACE'}</div><h1>{title}</h1><p>{subtitle}</p></div>{action&&<button className="btn btn-primary" onClick={action}><Icon size={16}/>{actionLabel}</button>}</div>}
function StatCard({label,value,detail,icon:Icon,tone='purple'}){return <div className="stat-card"><div className={`stat-icon ${tone}`}><Icon size={19}/></div><div className="stat-meta"><span>{label}</span><b>{value}</b><small>{detail}</small></div><div className="stat-spark">⌁</div></div>}
function Empty({title='Nothing here yet',desc='When you add records, they will appear here.',action,onAction}){return <div className="empty-state"><div className="empty-icon"><ClipboardList size={23}/></div><h3>{title}</h3><p>{desc}</p>{action&&<button className="btn btn-secondary" onClick={onAction}><Plus size={15}/>{action}</button>}</div>}
function LoadingOrError({loading,error,retry}){if(loading)return <div className="loading"><span className="spinner"/> Loading your workspace…</div>;if(error)return <div className="error-box"><b>Couldn’t load this data</b><p>{error}</p><button className="btn btn-secondary" onClick={retry}><RefreshCw size={15}/> Try again</button></div>;return null}

function useLoad(path,refresh,enabled=true){const [data,setData]=useState(null),[loading,setLoading]=useState(!!enabled),[error,setError]=useState('');const reload=()=>{if(!enabled)return;setLoading(true);setError('');api(path).then(setData).catch(e=>setError(e.message)).finally(()=>setLoading(false));};useEffect(()=>{reload()},[path,refresh,enabled]);return {data,loading,error,reload,setData};}
function PageRouter(props){switch(props.page){case'dashboard':return <Dashboard {...props}/>;case'leads':return <Leads {...props}/>;case'contacts':return <Contacts {...props}/>;case'deals':return <Deals {...props}/>;case'tasks':return <Tasks {...props}/>;case'organizations':return <Organizations {...props}/>;case'users':return <UsersPage {...props}/>;case'invites':return <Invites {...props}/>;case'watchlist':return <Watchlist {...props}/>;case'activity':return <ActivityPage {...props}/>;case'console':return <ApiConsole {...props}/>;case'settings':return <SettingsPage {...props}/>;default:return <Dashboard {...props}/>}}

function Dashboard({setPage,refresh,notify}){
 const leads=useLoad('/api/leads',refresh),deals=useLoad('/api/deals',refresh),tasks=useLoad('/task/',refresh),orgs=useLoad('/organization/all',refresh),feed=useLoad('/api/activity-timeline/organization?page=0&size=6',refresh);
 const ls=normalizeList(leads.data),ds=normalizeList(deals.data),ts=normalizeList(tasks.data),os=normalizeList(orgs.data),events=normalizeList(feed.data);
 const amount=ds.reduce((n,d)=>n+(Number(d.amount)||0),0);const won=ds.filter(d=>String(d.stage).includes('CLOSED_WON')).length;
 return <><PageHeader eyebrow="MONDAY, MADE MORE PRODUCTIVE" title="Your workspace" subtitle="Here’s what’s happening across your customer relationships." action={()=>setPage('leads')} actionLabel="Add a lead"/><div className="welcome-strip"><div><div className="welcome-label"><span className="live-dot"/> WORKSPACE OVERVIEW</div><h2>Good things happen when everything connects.</h2><p>Keep an eye on your pipeline, your people, and what needs attention next.</p></div><div className="welcome-art"><div className="welcome-ring ring-a"/><div className="welcome-ring ring-b"/><div className="welcome-glyph"><Zap size={30}/></div></div></div>
 <div className="stats-grid"><StatCard label="Total leads" value={leads.loading?'…':ls.length} detail="Across your pipeline" icon={Zap} tone="purple"/><StatCard label="Active deals" value={deals.loading?'…':ds.filter(d=>!String(d.stage||'').startsWith('CLOSED')).length} detail={`${won} closed won`} icon={BriefcaseBusiness} tone="blue"/><StatCard label="Tasks" value={tasks.loading?'…':ts.length} detail={`${ts.filter(t=>t.status==='COMPLETED').length} completed`} icon={ClipboardList} tone="orange"/><StatCard label="Organizations" value={orgs.loading?'…':os.length||'—'} detail="Connected workspace" icon={Building2} tone="green"/></div>
 <div className="dashboard-grid"><section className="panel pipeline-panel"><div className="panel-head"><div><h3>Deal pipeline</h3><p>Snapshot of your current opportunities</p></div><button className="text-link" onClick={()=>setPage('deals')}>View deals ↗</button></div><div className="pipeline-total"><div><span>Total deal value</span><b>{new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(amount)}</b></div><div className="pipeline-chip">{ds.length} opportunities</div></div><div className="pipeline-bars">{(dealEnums.stage).map((s,i)=>{const count=ds.filter(d=>d.stage===s).length;return <div className="pipeline-row" key={s}><span>{labelize(s)}</span><div className="bar-track"><i style={{width:`${ds.length?Math.max(count/ds.length*100,count?8:0):0}%`}}/></div><b>{count}</b></div>})}</div></section><section className="panel activity-panel"><div className="panel-head"><div><h3>Latest activity</h3><p>Recent changes in your organization</p></div><button className="icon-btn" onClick={()=>setPage('activity')}><ArrowDownToLine size={17}/></button></div><LoadingOrError loading={feed.loading} error={feed.error} retry={feed.reload}/>{!feed.loading&&!feed.error&&(events.length?<div className="activity-list">{events.slice(0,6).map((e,i)=><ActivityItem key={e.id||i} item={e}/>)}</div>:<Empty title="A quiet moment" desc="Recent organization activity will show up here."/> )}</section></div>
 <section className="panel quick-panel"><div className="panel-head"><div><h3>Jump back in</h3><p>Common actions, right where you need them.</p></div></div><div className="quick-actions">{[['Create a lead','leads',Zap,'purple'],['Add a contact','contacts',ContactRound,'blue'],['Create a deal','deals',BriefcaseBusiness,'green'],['Plan a task','tasks',ClipboardList,'orange']].map(([name,id,Icon,tone])=><button className="quick-action" key={id} onClick={()=>setPage(id)}><div className={`quick-icon ${tone}`}><Icon size={19}/></div><span>{name}</span><b>↗</b></button>)}</div></section></>;
}

function DataTable({columns,rows,onRow,actions,emptyTitle,emptyDesc}){return <div className="table-wrap"><table><thead><tr>{columns.map(c=><th key={c.key}>{c.label}</th>)}{actions&&<th className="actions-col">Actions</th>}</tr></thead><tbody>{rows.map((r,i)=><tr key={r.id||i} onClick={()=>onRow&&onRow(r)} className={onRow?'clickable-row':''}>{columns.map(c=><td key={c.key}>{c.render?c.render(r[c.key],r):pretty(r[c.key])}</td>)}{actions&&<td onClick={e=>e.stopPropagation()}><div className="row-actions">{actions(r)}</div></td>}</tr>)}</tbody></table>{!rows.length&&<Empty title={emptyTitle||'No records found'} desc={emptyDesc||'Try changing your search or create a new record.'}/>}</div>}
function Badge({children}){return <span className={`badge ${statusTone(children)}`}>{labelize(children||'Unknown')}</span>}
function SearchBar({value,onChange,placeholder='Search records...'}){return <div className="table-search"><Search size={16}/><input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/></div>}
function RecordModal({type,defaults,enums={},onClose,onSave,notify}){const [form,setForm]=useState({...defaults}),[busy,setBusy]=useState(false),[error,setError]=useState('');const set=(k,v)=>setForm(p=>({...p,[k]:v}));const fieldLabel=k=>labelize(k);const bools=['emailOptOut','sendNotificationEmail','recurringActivity'];const dates=['dueDate','closingDate'];const dts=['reminderAt'];const textareas=['description','note'];const omit=['id','createdAt','updatedAt','owner','organization','contacts','members','role','authorities','enabled','username','accountNonExpired','accountNonLocked','credentialsNonExpired','lastLoginAt','emailVerified','isActive','onBoarded','profileImage'];const fields=Object.keys(defaults).filter(k=>!omit.includes(k));const submit=async e=>{e.preventDefault();setBusy(true);setError('');try{const payload={...form};for(const k of ['annualRevenue','employeeCount','amount','expectedRevenue','probability'])if(payload[k]!==''&&payload[k]!=null)payload[k]=Number(payload[k]);for(const k of bools)payload[k]=Boolean(payload[k]);for(const k of Object.keys(payload))if(payload[k]==='')delete payload[k];await onSave(payload);onClose()}catch(e){setError(e.message)}finally{setBusy(false)}};return <Modal title={type} onClose={onClose} wide><form className="record-form" onSubmit={submit}><div className="form-grid">{fields.map(k=>{if(bools.includes(k))return <ToggleField key={k} label={fieldLabel(k)} value={!!form[k]} onChange={v=>set(k,v)}/>;return <Field key={k} label={fieldLabel(k)} value={form[k]} onChange={v=>set(k,v)} type={dates.includes(k)?'date':dts.includes(k)?'datetime-local':k.toLowerCase().includes('email')?'email':k.toLowerCase().includes('url')||k==='website'?'url':['amount','expectedRevenue','annualRevenue','employeeCount','probability','position'].includes(k)?'number':'text'} options={enums[k]} textarea={textareas.includes(k)} wide={textareas.includes(k)||['website','twitterHandle','secondaryEmail'].includes(k)}/>})}</div>{error&&<div className="inline-error">{error}</div>}<div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={busy}>{busy?'Saving…':'Save record'} <Check size={15}/></button></div></form></Modal>}
function ConfirmDelete({name,onClose,onConfirm}){return <Modal title="Delete record" onClose={onClose}><div className="confirm-copy"><div className="confirm-icon"><Trash2 size={22}/></div><h3>Delete {name}?</h3><p>This action can’t be undone. The record will be removed if the API accepts the request.</p></div><div className="modal-actions"><button className="btn btn-secondary" onClick={onClose}>Cancel</button><button className="btn btn-danger" onClick={onConfirm}><Trash2 size={15}/> Delete</button></div></Modal>}
function Leads({refresh,search,notify}){const q=useLoad('/api/leads',refresh),[modal,setModal]=useState(false),[editing,setEditing]=useState(null),[detail,setDetail]=useState(null),[del,setDel]=useState(null),[mail,setMail]=useState(null);const rows=normalizeList(q.data).filter(x=>JSON.stringify(x).toLowerCase().includes(search.toLowerCase()));const save=async p=>{if(editing){await api('/api/leads',{method:'PUT',body:{...p,leadId:editing.id||p.leadId}});notify('Lead updated')}else{await api('/api/leads',{method:'POST',body:p});notify('Lead created')}q.reload()};const remove=async()=>{try{await api(`/api/leads/${del.id}`,{method:'DELETE'});notify('Lead deleted');setDel(null);q.reload()}catch(e){notify(e.message,'error')}};return <><PageHeader eyebrow="SALES / PROSPECTS" title="Leads" subtitle="Capture prospects and move promising conversations forward." action={()=>{setEditing(null);setModal(true)}} actionLabel="Create lead"/><div className="summary-line"><div className="summary-count"><b>{rows.length}</b><span>leads in your pipeline</span></div><div className="toolbar"><SearchBar value={search} onChange={()=>{}} placeholder="Use top search to filter"/><button className="btn btn-secondary" onClick={q.reload}><RefreshCw size={15}/> Refresh</button></div></div><section className="panel data-panel"><LoadingOrError loading={q.loading} error={q.error} retry={q.reload}/>{!q.loading&&!q.error&&<DataTable columns={[{key:'firstName',label:'Lead',render:(v,r)=><div className="person-cell"><div className="avatar small">{initials(`${v||''} ${r.lastName||''}`||r.email)}</div><div><b>{[r.firstName,r.lastName].filter(Boolean).join(' ')||r.name||'Unnamed lead'}</b><small>{r.email||'No email'}</small></div></div>},{key:'company',label:'Company',render:v=>v||'—'},{key:'leadStatus',label:'Status',render:v=><Badge>{v}</Badge>},{key:'rating',label:'Rating',render:v=><Badge>{v}</Badge>},{key:'leadSource',label:'Source',render:v=>labelize(v||'—')},{key:'createdAt',label:'Created',render:v=>humanDate(v)}]} rows={rows} onRow={r=>setDetail(r)} actions={r=><><button className="icon-btn" title="Edit" onClick={()=>{setEditing(r);setModal(true)}}>✎</button><button className="icon-btn danger-hover" title="Delete" onClick={()=>setDel(r)}><Trash2 size={15}/></button></>}/>}</section>{modal&&<RecordModal type={editing?'Edit lead':'Create lead'} defaults={editing?{...leadDefaults,...editing}:leadDefaults} enums={leadEnums} onClose={()=>setModal(false)} onSave={save}/>}{del&&<ConfirmDelete name="lead" onClose={()=>setDel(null)} onConfirm={remove}/>}{detail&&<RecordDetail item={detail} title="Lead details" onClose={()=>setDetail(null)} actions={<><button className="btn btn-secondary" onClick={async()=>{try{await api(`/api/leads/${detail.id}/convert-to-contact`,{method:'POST'});notify('Lead converted to contact');setDetail(null);q.reload()}catch(e){notify(e.message,'error')}}}><ArrowLeftRight size={15}/> Convert to contact</button><button className="btn btn-primary" onClick={()=>{setMail(detail);setDetail(null)}}><Mail size={15}/> Send email</button></>}/>}{mail&&<MailModal lead={mail} onClose={()=>setMail(null)} notify={notify}/>}</>}
function RecordDetail({item,title,onClose,actions}){return <Modal title={title} onClose={onClose} wide><div className="detail-hero"><div className="detail-avatar">{initials(item.name||`${item.firstName||''} ${item.lastName||''}`||item.dealName||item.subject)}</div><div><h3>{item.name||[item.firstName,item.lastName].filter(Boolean).join(' ')||item.dealName||item.subject||item.title||'Record'}</h3><p>{item.email||item.company||item.stage&&labelize(item.stage)||item.status&&labelize(item.status)||'Record overview'}</p></div></div><div className="detail-grid">{Object.entries(item).filter(([k,v])=>v!==null&&v!==''&&typeof v!=='object').slice(0,24).map(([k,v])=><div key={k} className="detail-field"><span>{labelize(k)}</span><b>{pretty(v)}</b></div>)}</div>{actions&&<div className="modal-actions detail-actions">{actions}</div>}</Modal>}
function MailModal({lead,onClose,notify}){const [f,setF]=useState({to:lead.email||'',subject:'Following up',text:''}),[busy,setBusy]=useState(false),[error,setError]=useState('');return <Modal title="Send an email" onClose={onClose}><form onSubmit={async e=>{e.preventDefault();setBusy(true);setError('');try{const r=await api('/api/leads/send-mail',{method:'POST',body:f});notify(pretty(r)||'Email sent');onClose()}catch(e){setError(e.message)}finally{setBusy(false)}}}><div className="form-stack"><Field label="To" type="email" value={f.to} onChange={v=>setF(p=>({...p,to:v}))} required/><Field label="Subject" value={f.subject} onChange={v=>setF(p=>({...p,subject:v}))} required/><Field label="Message" value={f.text} onChange={v=>setF(p=>({...p,text:v}))} textarea required/></div>{error&&<div className="inline-error">{error}</div>}<div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={busy}><Send size={15}/> {busy?'Sending…':'Send email'}</button></div></form></Modal>}

function Contacts({refresh,search,notify}){const [source,setSource]=useState('owner'),[modal,setModal]=useState(false),[editing,setEditing]=useState(null),[del,setDel]=useState(null),[detail,setDetail]=useState(null),[upload,setUpload]=useState(false);const q=useLoad(source==='owner'?'/contact/owner/':`/contact/org/${encodeURIComponent(source)}/`,refresh);const rows=normalizeList(q.data).filter(x=>JSON.stringify(x).toLowerCase().includes(search.toLowerCase()));const save=async p=>{if(editing){await api(`/contact/${editing.id}`,{method:'PUT',body:p});notify('Contact updated')}else{await api('/contact/create',{method:'POST',body:p});notify('Contact created')}q.reload()};const remove=async()=>{try{await api(`/contact/${del.id}`,{method:'DELETE'});notify('Contact deleted');setDel(null);q.reload()}catch(e){notify(e.message,'error')}};return <><PageHeader eyebrow="RELATIONSHIPS" title="Contacts" subtitle="Keep the people behind every opportunity close at hand." action={()=>{setEditing(null);setModal(true)}} actionLabel="Add contact"/><div className="toolbar toolbar-spread"><div className="tabs"><button className={source==='owner'?'selected':''} onClick={()=>setSource('owner')}>My contacts</button><button className={source!=='owner'?'selected':''} onClick={()=>{const id=prompt('Enter organization ID');if(id)setSource(id)}}>By organization</button></div><div className="toolbar"><button className="btn btn-secondary" onClick={()=>setUpload(true)}><ArrowDownToLine size={15}/> Import</button><button className="btn btn-secondary" onClick={async()=>{try{const data=await api('/contact/export');const blob=new Blob([typeof data==='string'?data:JSON.stringify(data,null,2)],{type:'text/csv'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='contacts-export.csv';a.click();URL.revokeObjectURL(a.href);notify('Export downloaded')}catch(e){notify(e.message,'error')}}}><ArrowDownToLine size={15}/> Export</button><button className="btn btn-secondary" onClick={q.reload}><RefreshCw size={15}/></button></div></div><section className="panel data-panel"><LoadingOrError loading={q.loading} error={q.error} retry={q.reload}/>{!q.loading&&!q.error&&<DataTable columns={[{key:'name',label:'Contact',render:(v,r)=><div className="person-cell"><div className="avatar small">{initials(v||r.email)}</div><div><b>{v||'Unnamed contact'}</b><small>{r.email||'No email'}</small></div></div>},{key:'title',label:'Job title',render:v=>v||'—'},{key:'phoneNumber',label:'Phone',render:v=>v||'—'},{key:'department',label:'Department',render:v=>v||'—'},{key:'contactSource',label:'Source',render:v=>labelize(v||'—')},{key:'createdAt',label:'Added',render:v=>humanDate(v)}]} rows={rows} onRow={setDetail} actions={r=><><button className="icon-btn" onClick={()=>{setEditing(r);setModal(true)}}>✎</button><button className="icon-btn danger-hover" onClick={()=>setDel(r)}><Trash2 size={15}/></button></>}/>}</section>{modal&&<RecordModal type={editing?'Edit contact':'Create contact'} defaults={editing?{...contactDefaults,...editing}:contactDefaults} onClose={()=>setModal(false)} onSave={save}/>}{del&&<ConfirmDelete name="contact" onClose={()=>setDel(null)} onConfirm={remove}/>}{detail&&<RecordDetail item={detail} title="Contact details" onClose={()=>setDetail(null)}/>}{upload&&<ImportModal onClose={()=>setUpload(false)} notify={notify} reload={q.reload}/>}</>}
function ImportModal({onClose,notify,reload}){const [file,setFile]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState('');return <Modal title="Import contacts" onClose={onClose}><form onSubmit={async e=>{e.preventDefault();if(!file)return;setBusy(true);setError('');const data=new FormData();data.append('file',file);try{const r=await api('/contact/import',{method:'POST',body:data});notify(pretty(r)||'Contacts imported');reload();onClose()}catch(e){setError(e.message)}finally{setBusy(false)}}}><div className="upload-zone"><ArrowDownToLine size={26}/><b>Choose a contact file</b><p>Upload the CSV or file format supported by your backend.</p><input type="file" onChange={e=>setFile(e.target.files?.[0]||null)} required/></div>{error&&<div className="inline-error">{error}</div>}<div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={busy||!file}>{busy?'Importing…':'Import contacts'}</button></div></form></Modal>}

function Deals({refresh,search,notify}){const q=useLoad('/api/deals',refresh),[modal,setModal]=useState(false),[editing,setEditing]=useState(null),[detail,setDetail]=useState(null),[del,setDel]=useState(null);const rows=normalizeList(q.data).filter(x=>JSON.stringify(x).toLowerCase().includes(search.toLowerCase()));const save=async p=>{if(editing){await api(`/api/deals/${editing.id}`,{method:'PUT',body:p});notify('Deal updated')}else{await api('/api/deals',{method:'POST',body:p});notify('Deal created')}q.reload()};const remove=async()=>{try{await api(`/api/deals/${del.id}`,{method:'DELETE'});notify('Deal deleted');setDel(null);q.reload()}catch(e){notify(e.message,'error')}};const currency=v=>v==null?'—':new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(Number(v)||0);return <><PageHeader eyebrow="REVENUE / OPPORTUNITIES" title="Deals" subtitle="Track every opportunity from first conversation to closed-won." action={()=>{setEditing(null);setModal(true)}} actionLabel="Create deal"/><div className="stats-grid compact-stats"><StatCard label="Total opportunities" value={rows.length} detail="All deal stages" icon={BriefcaseBusiness}/><StatCard label="Pipeline value" value={currency(rows.reduce((n,r)=>n+(Number(r.amount)||0),0))} detail="Total deal amount" icon={Gauge} tone="green"/><StatCard label="Weighted revenue" value={currency(rows.reduce((n,r)=>n+(Number(r.expectedRevenue)||0),0))} detail="Expected revenue" icon={Activity} tone="blue"/></div><div className="toolbar toolbar-spread"><div className="tabs"><span className="tab-static">All opportunities</span><span className="count-pill">{rows.length}</span></div><button className="btn btn-secondary" onClick={q.reload}><RefreshCw size={15}/> Refresh</button></div><section className="panel data-panel"><LoadingOrError loading={q.loading} error={q.error} retry={q.reload}/>{!q.loading&&!q.error&&<DataTable columns={[{key:'dealName',label:'Deal name',render:(v,r)=><div className="deal-name"><div className="deal-mark"><BriefcaseBusiness size={16}/></div><div><b>{v||'Untitled deal'}</b><small>{r.ownerName||'Owner not assigned'}</small></div></div>},{key:'stage',label:'Stage',render:v=><Badge>{v}</Badge>},{key:'amount',label:'Amount',render:currency},{key:'probability',label:'Probability',render:v=><div className="prob-cell"><div className="mini-progress"><i style={{width:`${Number(v)||0}%`}}/></div><span>{v??0}%</span></div>},{key:'closingDate',label:'Close date',render:humanDate}]} rows={rows} onRow={setDetail} actions={r=><><button className="icon-btn" onClick={()=>{setEditing(r);setModal(true)}}>✎</button><button className="icon-btn danger-hover" onClick={()=>setDel(r)}><Trash2 size={15}/></button></>}/>}</section>{modal&&<RecordModal type={editing?'Edit deal':'Create deal'} defaults={editing?{...dealDefaults,...editing}:dealDefaults} enums={dealEnums} onClose={()=>setModal(false)} onSave={save}/>}{del&&<ConfirmDelete name="deal" onClose={()=>setDel(null)} onConfirm={remove}/>}{detail&&<RecordDetail item={detail} title="Deal overview" onClose={()=>setDetail(null)}/>}</>}

function Tasks({refresh,search,notify}){const [view,setView]=useState('board'),[modal,setModal]=useState(false),[editing,setEditing]=useState(null),[detail,setDetail]=useState(null),[del,setDel]=useState(null);const q=useLoad(view==='board'?'/task/board':'/task/',refresh);let rows=normalizeList(q.data);if(!rows.length&&q.data&&typeof q.data==='object'&&!Array.isArray(q.data))rows=Object.values(q.data).flatMap(v=>Array.isArray(v)?v:[]);rows=rows.filter(x=>JSON.stringify(x).toLowerCase().includes(search.toLowerCase()));const save=async p=>{if(editing){await api(`/task/${editing.id}`,{method:'PUT',body:p});notify('Task updated')}else{await api('/task/create',{method:'POST',body:p});notify('Task created')}q.reload()};const remove=async()=>{try{await api(`/task/${del.id}`,{method:'DELETE'});notify('Task deleted');setDel(null);q.reload()}catch(e){notify(e.message,'error')}};const move=async(task,status)=>{try{await api(`/task/${task.id}/move`,{method:'PATCH',body:{status,position:0}});notify('Task moved');q.reload()}catch(e){notify(e.message,'error')}};const columns=taskEnums.status;const byStatus=s=>rows.filter(t=>t.status===s);return <><PageHeader eyebrow="EXECUTION / FOLLOW-THROUGH" title="Tasks" subtitle="Make the next step clear, assigned, and easy to finish." action={()=>{setEditing(null);setModal(true)}} actionLabel="Create task"/><div className="toolbar toolbar-spread"><div className="tabs"><button className={view==='board'?'selected':''} onClick={()=>setView('board')}>Board view</button><button className={view==='list'?'selected':''} onClick={()=>setView('list')}>List view</button></div><button className="btn btn-secondary" onClick={q.reload}><RefreshCw size={15}/> Refresh</button></div><LoadingOrError loading={q.loading} error={q.error} retry={q.reload}/>{!q.loading&&!q.error&&(view==='board'?<div className="kanban">{columns.map((s,i)=><div className="kanban-column" key={s}><div className="kanban-head"><span className={`kanban-dot dot-${i}`}/><b>{labelize(s)}</b><span className="count-pill">{byStatus(s).length}</span></div>{byStatus(s).map(t=><div className="task-card" key={t.id} onClick={()=>setDetail(t)}><div className="task-card-top"><Badge>{t.priority}</Badge><button className="icon-btn" onClick={e=>{e.stopPropagation();setEditing(t);setModal(true)}}>✎</button></div><h4>{t.subject||'Untitled task'}</h4><p>{t.description||'No description provided.'}</p><div className="task-card-bottom"><span><Bell size={13}/>{humanDate(t.dueDate)}</span><select aria-label="Move task status" value={t.status||'NOT_STARTED'} onClick={e=>e.stopPropagation()} onChange={e=>{e.stopPropagation();move(t,e.target.value)}}>{columns.map(o=><option value={o} key={o}>{labelize(o)}</option>)}</select></div></div>)}<button className="add-task-inline" onClick={()=>{setEditing(null);setModal(true)}}><Plus size={14}/> Add task</button></div>)}</div>:<section className="panel data-panel"><DataTable columns={[{key:'subject',label:'Task',render:(v,r)=><div><b>{v||'Untitled task'}</b><small className="subline">{r.description||''}</small></div>},{key:'status',label:'Status',render:v=><Badge>{v}</Badge>},{key:'priority',label:'Priority',render:v=><Badge>{v}</Badge>},{key:'dueDate',label:'Due date',render:humanDate}]} rows={rows} onRow={setDetail} actions={r=><><button className="icon-btn" onClick={()=>{setEditing(r);setModal(true)}}>✎</button><button className="icon-btn danger-hover" onClick={()=>setDel(r)}><Trash2 size={15}/></button></>}/></section>)}{modal&&<RecordModal type={editing?'Edit task':'Create task'} defaults={editing?{...taskDefaults,...editing}:taskDefaults} enums={taskEnums} onClose={()=>setModal(false)} onSave={save}/>}{del&&<ConfirmDelete name="task" onClose={()=>setDel(null)} onConfirm={remove}/>}{detail&&<RecordDetail item={detail} title="Task details" onClose={()=>setDetail(null)} actions={<button className="btn btn-primary" onClick={()=>{setEditing(detail);setDetail(null);setModal(true)}}>Edit task</button>}/>}</>}

function Organizations({refresh,search,notify}){const q=useLoad('/organization/all',refresh),[modal,setModal]=useState(false),[detail,setDetail]=useState(null);const [f,setF]=useState({name:'',category:'',country:'',websiteUrl:''});const rows=normalizeList(q.data).filter(x=>JSON.stringify(x).toLowerCase().includes(search.toLowerCase()));const create=async e=>{e.preventDefault();try{const r=await api('/organization/create',{method:'POST',body:f});notify('Organization created');setModal(false);setF({name:'',category:'',country:'',websiteUrl:''});q.reload()}catch(e){notify(e.message,'error')}};return <><PageHeader eyebrow="COMPANY DIRECTORY" title="Organizations" subtitle="The companies and teams connected to your customer network." action={()=>setModal(true)} actionLabel="Add organization"/><div className="stats-grid compact-stats"><StatCard label="Organizations" value={rows.length} detail="Visible to your account" icon={Building2}/><StatCard label="Directory" value="Connected" detail="Workspace records" icon={Users} tone="green"/></div><section className="panel data-panel"><LoadingOrError loading={q.loading} error={q.error} retry={q.reload}/>{!q.loading&&!q.error&&<DataTable columns={[{key:'name',label:'Organization',render:(v,r)=><div className="person-cell"><div className="org-mark"><Building2 size={17}/></div><div><b>{v||'Unnamed organization'}</b><small>{r.websiteUrl||r.category||'Organization'}</small></div></div>},{key:'category',label:'Category',render:v=>v||'—'},{key:'country',label:'Country',render:v=>v||'—'},{key:'city',label:'City',render:v=>v||'—'},{key:'createdAt',label:'Created',render:humanDate}]} rows={rows} onRow={setDetail} actions={r=><button className="icon-btn" onClick={()=>setDetail(r)}>↗</button>}/>}</section>{modal&&<Modal title="Create organization" onClose={()=>setModal(false)}><form onSubmit={create}><div className="form-stack"><Field label="Organization name" value={f.name} onChange={v=>setF(p=>({...p,name:v}))} required/><Field label="Category" value={f.category} onChange={v=>setF(p=>({...p,category:v}))}/><Field label="Country" value={f.country} onChange={v=>setF(p=>({...p,country:v}))}/><Field label="Website URL" type="url" value={f.websiteUrl} onChange={v=>setF(p=>({...p,websiteUrl:v}))}/></div><div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={()=>setModal(false)}>Cancel</button><button className="btn btn-primary">Create organization</button></div></form></Modal>}{detail&&<RecordDetail item={detail} title="Organization details" onClose={()=>setDetail(null)}/>}</>}

function UsersPage({refresh,search,notify}){const [pageNo,setPageNo]=useState(0),[detail,setDetail]=useState(null),[edit,setEdit]=useState(null);const q=useLoad(`/api/users?page=${pageNo}&size=10`,refresh);const payload=q.data||{};const rows=normalizeList(payload).filter(x=>JSON.stringify(x).toLowerCase().includes(search.toLowerCase()));const save=async p=>{await api(`/api/users/${edit.id}`,{method:'PUT',body:p});notify('User updated');setEdit(null);q.reload()};const toggle=async(u,active)=>{try{await api(`/api/users/${u.id}/${active?'activate':'deactivate'}`,{method:'PATCH'});notify(active?'User activated':'User deactivated');q.reload()}catch(e){notify(e.message,'error')}};const userDefaults=edit?{firstName:edit.firstName||'',lastName:edit.lastName||'',email:edit.email||'',phoneNumber:edit.phoneNumber||'',jobTitle:edit.jobTitle||'',department:edit.department||'',profileImage:edit.profileImage||'',onBoarded:!!edit.onBoarded,isActive:!!edit.isActive,emailVerified:!!edit.emailVerified}:{};return <><PageHeader eyebrow="ACCESS / TEAM" title="Users" subtitle="Manage the people who have access to your CRM workspace."/><div className="stats-grid compact-stats"><StatCard label="Team members" value={payload.totalElements??rows.length} detail="Across this workspace" icon={Users}/><StatCard label="Active on this page" value={rows.filter(u=>u.isActive).length} detail="Current page" icon={ShieldCheck} tone="green"/><StatCard label="Page" value={`${pageNo+1}${payload.totalPages?` / ${payload.totalPages}`:''}`} detail="Team directory" icon={Activity} tone="blue"/></div><section className="panel data-panel"><LoadingOrError loading={q.loading} error={q.error} retry={q.reload}/>{!q.loading&&!q.error&&<DataTable columns={[{key:'firstName',label:'Team member',render:(v,r)=><div className="person-cell"><div className="avatar small">{initials(`${v||''} ${r.lastName||''}`||r.email)}</div><div><b>{[v,r.lastName].filter(Boolean).join(' ')||'Unnamed user'}</b><small>{r.email}</small></div></div>},{key:'jobTitle',label:'Job title',render:v=>v||'—'},{key:'department',label:'Department',render:v=>v||'—'},{key:'isActive',label:'Status',render:v=><Badge>{v?'ACTIVE':'INACTIVE'}</Badge>},{key:'createdAt',label:'Joined',render:humanDate}]} rows={rows} onRow={setDetail} actions={u=><><button className="icon-btn" title="Edit user" onClick={()=>setEdit(u)}>✎</button><button className="icon-btn" title={u.isActive?'Deactivate':'Activate'} onClick={()=>toggle(u,!u.isActive)}>{u.isActive?<ShieldCheck size={15}/>:<Check size={15}/>}</button></>}/>}<div className="pagination"><span>Showing {rows.length} of {payload.totalElements??rows.length} users</span><div><button className="btn btn-secondary" disabled={pageNo===0} onClick={()=>setPageNo(n=>n-1)}>Previous</button><button className="btn btn-secondary" disabled={payload.last===true||(!payload.totalPages&&rows.length<10)} onClick={()=>setPageNo(n=>n+1)}>Next</button></div></div></section>{edit&&<RecordModal type="Edit user" defaults={userDefaults} onClose={()=>setEdit(null)} onSave={save}/>}{detail&&<RecordDetail item={detail} title="User profile" onClose={()=>setDetail(null)}/>}</>}

function Invites({refresh,notify}){const [email,setEmail]=useState(''),[roleId,setRoleId]=useState(''),[token,setInviteToken]=useState(''),[validated,setValidated]=useState(null),[busy,setBusy]=useState(false);const create=async e=>{e.preventDefault();setBusy(true);try{const r=await api('/api/organization/invites',{method:'POST',body:{email,roleId}});setInviteToken(r?.token||r?.data?.token||'');notify('Invitation created');}catch(e){notify(e.message,'error')}finally{setBusy(false)}};const validate=async e=>{e.preventDefault();try{setValidated(await api(`/api/organization/invites/${encodeURIComponent(token)}`))}catch(e){notify(e.message,'error')}};return <><PageHeader eyebrow="TEAM / ACCESS CONTROL" title="Invitations" subtitle="Invite teammates into your organization with the right role."/><div className="two-col-layout"><section className="panel form-panel"><div className="panel-head"><div><h3>Create an invitation</h3><p>Send access to a new teammate.</p></div><div className="panel-icon"><Mail size={18}/></div></div><form onSubmit={create} className="form-stack"><Field label="Teammate email" type="email" value={email} onChange={setEmail} required/><Field label="Role ID" value={roleId} onChange={setRoleId} required placeholder="UUID for the role"/><div className="form-hint">The API expects a role UUID. Create or retrieve the role in your backend first.</div><button className="btn btn-primary" disabled={busy}><Send size={15}/>{busy?'Creating…':'Create invitation'}</button></form>{token&&<div className="token-result"><span>Invitation token</span><code>{token}</code><button className="btn btn-secondary" onClick={()=>navigator.clipboard?.writeText(token)}>Copy token</button><button className="text-link" onClick={()=>{const url=`${location.origin}/?token=${encodeURIComponent(token)}`;navigator.clipboard?.writeText(url);notify('Invite URL copied')}}>Copy invite URL</button></div>}</section><section className="panel form-panel"><div className="panel-head"><div><h3>Validate an invitation</h3><p>Check a token before accepting it.</p></div><div className="panel-icon"><ShieldCheck size={18}/></div></div><form onSubmit={validate} className="form-stack"><Field label="Invitation token" value={token} onChange={setInviteToken} required/><button className="btn btn-secondary"><Check size={15}/> Validate token</button></form>{validated&&<div className="validated-card"><div className="validated-head"><Check size={16}/> Invitation details</div>{Object.entries(validated).map(([k,v])=><div className="detail-field" key={k}><span>{labelize(k)}</span><b>{pretty(v)}</b></div>)}<button className="btn btn-primary" onClick={()=>location.href=`/?token=${encodeURIComponent(token)}`}>Continue to registration →</button></div>}</section></div></>}

function Watchlist({refresh,search,notify}){const q=useLoad('/api/watchList/readAll',refresh),[modal,setModal]=useState(false),[f,setF]=useState({name:'',email:'',phoneNumber:''});const rows=normalizeList(q.data).filter(x=>JSON.stringify(x).toLowerCase().includes(search.toLowerCase()));const create=async e=>{e.preventDefault();try{await api('/api/watchList/create',{method:'POST',body:f});notify('Watchlist entry created');setModal(false);q.reload()}catch(e){notify(e.message,'error')}};const remove=async r=>{try{await api(`/api/watchList/delete/${r.id}`,{method:'POST'});notify('Watchlist entry deleted');q.reload()}catch(e){notify(e.message,'error')}};return <><PageHeader eyebrow="MONITORING" title="Watchlist" subtitle="Keep important people and records on your radar." action={()=>setModal(true)} actionLabel="Add to watchlist"/><section className="panel data-panel"><LoadingOrError loading={q.loading} error={q.error} retry={q.reload}/>{!q.loading&&!q.error&&<DataTable columns={[{key:'name',label:'Name',render:(v,r)=><div className="person-cell"><div className="avatar small">{initials(v||r.email)}</div><div><b>{v||'Unnamed entry'}</b><small>{r.email||'No email'}</small></div></div>},{key:'phoneNumber',label:'Phone',render:v=>v||'—'},{key:'createdAt',label:'Added',render:humanDate}]} rows={rows} actions={r=><button className="icon-btn danger-hover" onClick={()=>remove(r)}><Trash2 size={15}/></button>}/>}</section>{modal&&<Modal title="Add to watchlist" onClose={()=>setModal(false)}><form onSubmit={create}><div className="form-stack"><Field label="Name" value={f.name} onChange={v=>setF(p=>({...p,name:v}))} required/><Field label="Email" type="email" value={f.email} onChange={v=>setF(p=>({...p,email:v}))}/><Field label="Phone number" value={f.phoneNumber} onChange={v=>setF(p=>({...p,phoneNumber:v}))}/></div><div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={()=>setModal(false)}>Cancel</button><button className="btn btn-primary">Add entry</button></div></form></Modal>}</>}

function ActivityItem({item}){return <div className="activity-item"><div className={`activity-symbol ${statusTone(item.actionType)}`}><Activity size={14}/></div><div className="activity-content"><b>{labelize(item.actionType||'Activity')} <span>{item.entityType?`· ${labelize(item.entityType)}`:''}</span></b><small>{item.changes?.length?item.changes.map(c=>`${labelize(c.fieldName)}: ${c.oldValue||'—'} → ${c.newValue||'—'}`).join(' · '):item.entityId||'Workspace event'}</small><time>{item.createdAt?new Date(item.createdAt).toLocaleString():''}</time></div></div>}
function ActivityPage({refresh,search}){const [mode,setMode]=useState('organization'),[entityType,setEntityType]=useState('LEAD'),[entityId,setEntityId]=useState('');const [go,setGo]=useState(false);const q=useLoad(mode==='organization'?'/api/activity-timeline/organization?page=0&size=50':`/api/activity-timeline?entityType=${encodeURIComponent(entityType)}&entityId=${encodeURIComponent(entityId)}`,refresh,mode==='organization'||go&&!!entityId);const rows=normalizeList(q.data).filter(x=>JSON.stringify(x).toLowerCase().includes(search.toLowerCase()));return <><PageHeader eyebrow="AUDIT / VISIBILITY" title="Activity timeline" subtitle="A transparent history of what changed, and when."/><div className="toolbar toolbar-spread"><div className="tabs"><button className={mode==='organization'?'selected':''} onClick={()=>{setMode('organization');setGo(false)}}>Organization feed</button><button className={mode==='entity'?'selected':''} onClick={()=>{setMode('entity');setGo(false)}}>Entity timeline</button></div><button className="btn btn-secondary" onClick={q.reload}><RefreshCw size={15}/> Refresh</button></div>{mode==='entity'&&<section className="panel entity-query"><Field label="Entity type" value={entityType} onChange={setEntityType} placeholder="LEAD, CONTACT, DEAL..."/><Field label="Entity UUID" value={entityId} onChange={v=>{setEntityId(v);setGo(false)}}/><button className="btn btn-primary" onClick={()=>{setGo(true);q.reload()}} disabled={!entityId}>Load timeline</button></section>}<section className="panel timeline-panel"><LoadingOrError loading={q.loading} error={q.error} retry={q.reload}/>{!q.loading&&!q.error&&(rows.length?<div className="timeline-list">{rows.map((e,i)=><ActivityItem key={e.id||i} item={e}/>)}</div>:<Empty title="No activity to show" desc="Choose an entity or check back when activity has been recorded."/>)}</section></>}

const API_ROUTES=[
 ['GET','/auth/me','Get current user'],['POST','/auth/login','Log in'],['POST','/auth/register','Register'],['POST','/auth/register-invite','Register from invite'],['POST','/auth/forgotPassword/verifyMail/{email}','Request password reset OTP'],['POST','/auth/forgotPassword/verifyOTP/{email}/{otp}','Verify reset OTP'],['POST','/auth/forgotPassword/changePassword/{email}','Change password'],
 ['GET','/api/leads','List leads'],['POST','/api/leads','Create lead'],['PUT','/api/leads','Update lead'],['GET','/api/leads/{id}','Get lead'],['DELETE','/api/leads/{id}','Delete lead'],['POST','/api/leads/{id}/convert-to-contact','Convert lead to contact'],['POST','/api/leads/send-mail','Send email to lead'],
 ['GET','/contact/owner/','Contacts by owner'],['GET','/contact/org/{orgId}/','Contacts by organization'],['POST','/contact/create','Create contact'],['PUT','/contact/{id}','Update contact'],['GET','/contact/{id}','Get contact'],['DELETE','/contact/{id}','Delete contact'],['POST','/contact/import','Import contacts (multipart)'],['GET','/contact/export','Export contacts'],
 ['GET','/api/deals','List deals'],['POST','/api/deals','Create deal'],['GET','/api/deals/{id}','Get deal'],['PUT','/api/deals/{id}','Update deal'],['DELETE','/api/deals/{id}','Delete deal'],
 ['GET','/task/','List tasks'],['GET','/task/board','Task board'],['POST','/task/create','Create task'],['GET','/task/{id}','Get task'],['PUT','/task/{id}','Update task'],['DELETE','/task/{id}','Delete task'],['PATCH','/task/{id}/move','Move task'],
 ['GET','/organization/all','List organizations'],['POST','/organization/create','Create organization'],['GET','/organization/{id}','Get organization'],['GET','/api/users','List users'],['GET','/api/users/{id}','Get user'],['PUT','/api/users/{id}','Update user'],['PATCH','/api/users/{id}/activate','Activate user'],['PATCH','/api/users/{id}/deactivate','Deactivate user'],
 ['POST','/api/organization/invites','Create organization invite'],['GET','/api/organization/invites/{token}','Validate invite'],['POST','/api/watchList/readAll','Read watchlist'],['POST','/api/watchList/create','Create watchlist entry'],['POST','/api/watchList/delete/{id}','Delete watchlist entry'],['GET','/api/activity-timeline','Entity timeline'],['GET','/api/activity-timeline/organization','Organization activity feed']
];
function ApiConsole({notify}){const [method,setMethod]=useState('GET'),[path,setPath]=useState('/auth/me'),[params,setParams]=useState('{}'),[body,setBody]=useState('{}'),[result,setResult]=useState(null),[busy,setBusy]=useState(false),[err,setErr]=useState(''),[filter,setFilter]=useState('');const routes=API_ROUTES.filter(r=>`${r[0]} ${r[1]} ${r[2]}`.toLowerCase().includes(filter.toLowerCase()));const execute=async e=>{e.preventDefault();setBusy(true);setErr('');setResult(null);try{let p=path;const values=JSON.parse(params||'{}');for(const [k,v] of Object.entries(values))p=p.replace(`{${k}}`,encodeURIComponent(v));const opts={method};if(['POST','PUT','PATCH'].includes(method)){if(path==='/contact/import'){throw new Error('Use the Contacts → Import action for multipart uploads.')}opts.body=JSON.parse(body||'{}')}const data=await api(p,opts);setResult(data);notify('API request completed')}catch(e){setErr(e.message)}finally{setBusy(false)}};const choose=r=>{setMethod(r[0]);setPath(r[1]);setParams('{}');setBody('{}');setResult(null);setErr('')};return <><PageHeader eyebrow="DEVELOPER TOOLS" title="API console" subtitle="Call any documented endpoint directly with your current JWT."/><div className="console-layout"><section className="panel route-panel"><div className="panel-head"><div><h3>Endpoints</h3><p>{API_ROUTES.length} documented routes</p></div></div><div className="route-search"><Search size={15}/><input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Filter endpoints"/></div><div className="route-list">{routes.map((r,i)=><button key={i} className={`route-item ${path===r[1]&&method===r[0]?'route-active':''}`} onClick={()=>choose(r)}><span className={`method method-${r[0].toLowerCase()}`}>{r[0]}</span><div><b>{r[2]}</b><small>{r[1]}</small></div></button>)}</div></section><section className="panel console-editor"><div className="panel-head"><div><h3>Request builder</h3><p>Authorization is added automatically when a token is set.</p></div><div className="panel-icon"><FileJson size={18}/></div></div><form onSubmit={execute}><div className="request-line"><select value={method} onChange={e=>setMethod(e.target.value)}>{['GET','POST','PUT','PATCH','DELETE'].map(m=><option key={m}>{m}</option>)}</select><input value={path} onChange={e=>setPath(e.target.value)} required/><button className="btn btn-primary" disabled={busy}>{busy?'Sending…':<><Send size={15}/> Send</>}</button></div><Field label="Path parameters (JSON)" value={params} onChange={setParams} textarea placeholder={'{"id":"..."}'}/>{['POST','PUT','PATCH'].includes(method)&&<Field label="Request body (JSON)" value={body} onChange={setBody} textarea/>}<div className="console-auth"><KeyRound size={15}/><span>Bearer token</span><b>{getToken()?'Attached':'Not configured'}</b><span className="console-auth-spacer"/><button type="button" className="text-link" onClick={()=>notify('Set your token in API Settings')}>Manage token</button></div></form>{err&&<div className="inline-error console-error">{err}</div>}{result!==null&&<div className="response-box"><div className="response-head"><b>Response</b><span className="badge green">Success</span><button className="icon-btn" onClick={()=>navigator.clipboard?.writeText(pretty(result))}>Copy</button></div><pre>{pretty(result)}</pre></div>}</section></div></>}

function SettingsPage({notify,logout}){const [base,setBaseValue]=useState(getBase()),[token,setTokenValue]=useState(getToken()),[show,setShow]=useState(false);const save=()=>{setBase(base);setToken(token);notify('API settings saved. Refresh the page if needed.')};return <><PageHeader eyebrow="CONFIGURATION" title="API settings" subtitle="Connect the frontend to your backend and manage authentication."/><div className="settings-layout"><section className="panel settings-panel"><div className="settings-title"><div className="settings-icon"><Settings size={19}/></div><div><h3>Backend connection</h3><p>Set the base URL used by all API requests.</p></div></div><div className="form-stack"><Field label="API base URL" value={base} onChange={setBaseValue} required placeholder="http://localhost:8080"/><div className="form-hint">Do not add a trailing slash. Current default comes from VITE_API_BASE_URL.</div><button className="btn btn-primary" onClick={save}><Check size={15}/> Save connection</button></div></section><section className="panel settings-panel"><div className="settings-title"><div className="settings-icon"><KeyRound size={19}/></div><div><h3>Authentication token</h3><p>Requests use this JWT in the Authorization header.</p></div></div><div className="form-stack"><label className="field"><span>Bearer token</span><div className="secret-input"><input type={show?'text':'password'} value={token} onChange={e=>setTokenValue(e.target.value)} placeholder="Paste JWT access token"/><button type="button" className="icon-btn" onClick={()=>setShow(v=>!v)}>{show?'Hide':'Show'}</button></div></label><div className="form-hint">Stored locally in this browser as <code>crm_token</code>.</div><button className="btn btn-primary" onClick={save}><Check size={15}/> Save token</button><button className="btn btn-secondary" onClick={()=>{setTokenValue('');setToken('');notify('Token cleared')}}><LogOut size={15}/> Clear token</button></div></section><section className="panel settings-panel"><div className="settings-title"><div className="settings-icon"><ShieldCheck size={19}/></div><div><h3>Connection checklist</h3><p>Quick diagnostics before you start.</p></div></div><div className="check-list"><div><Check size={16}/><span>Base URL is set</span><b>{base?'Configured':'Missing'}</b></div><div><Check size={16}/><span>JWT token</span><b>{token?'Configured':'Optional for public auth endpoints'}</b></div><div><CircleHelp size={16}/><span>CORS</span><b>Backend must allow this origin</b></div><div><CircleHelp size={16}/><span>HTTP / HTTPS</span><b>Use HTTPS in production</b></div></div><button className="btn btn-secondary" onClick={async()=>{try{const r=await api('/auth/me');notify('API reachable. Current user loaded.');console.log(r)}catch(e){notify(e.message,'error')}}}><RefreshCw size={15}/> Test authenticated request</button></section></div><div className="settings-warning"><ShieldCheck size={18}/><div><b>Security note</b><p>This frontend stores the JWT in localStorage for convenience. For production, consider secure HttpOnly cookies, HTTPS, and a strict CORS allowlist.</p></div></div></>}

export default App;
