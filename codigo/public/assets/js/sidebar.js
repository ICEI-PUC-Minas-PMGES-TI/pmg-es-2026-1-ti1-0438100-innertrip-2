/**
 * PSYCHE — Sidebar Reutilizável
 * Injeta a sidebar padrão em qualquer <aside class="sidebar">
 * e preenche nome/iniciais do usuário logado via sessionStorage.
 *
 * Como usar em qualquer página:
 *   1. Adicione <aside class="sidebar" id="sidebar"></aside> no HTML
 *   2. Inclua <script src="CAMINHO/assets/js/sidebar.js"></script>
 *   3. Inclua <link rel="stylesheet" href="CAMINHO/assets/css/sidebar.css">
 */

(function () {

  /* ── Mapa de links por tipoUsuario ── */
  const NAV_PSICOLOGO = [
    { label: 'Dashboard',      href: '/modulos/dashboard/dashboard.html',                icon: 'grid'       },
    { label: 'Meus Pacientes', href: '/modulos/cadastro_pacientes/index.html',           icon: 'person'     },
    { label: 'Consultas',      href: '/modulos/consultas/index.html',                    icon: 'file-text'  },
    { label: 'Configurações',  href: '#',                                                icon: 'settings'   },
  ];

  const NAV_ESTUDANTE = [
    { label: 'Dashboard',      href: '/modulos/dashboard/dashboard.html',                icon: 'grid'       },
    { label: 'Meus Pacientes', href: '/modulos/cadastro_pacientes/index.html',           icon: 'person'     },
    { label: 'Consultas',      href: '/modulos/consultas/index.html',                    icon: 'file-text'  },
    { label: 'Configurações',  href: '#',                                                icon: 'settings'   },
  ];

  const NAV_PACIENTE = [
    { label: 'Dashboard',      href: '/modulos/dashboardPaciente/dashboardPaciente.html', icon: 'grid'      },
    { label: 'Consultas',      href: '/modulos/consultas/index.html',                     icon: 'file-text' },
    { label: 'Psicólogos',     href: '/modulos/EncontrarPsicologos/psicologos.html',      icon: 'search'    },
    { label: 'Agendamentos',   href: '/modulos/agendamento_de_consultas/index.html',      icon: 'calendar'   },
    { label: 'Configurações',  href: '#',                                                 icon: 'settings'  },
  ];

  const NAV_FACULDADE = [
    { label: 'Dashboard',      href: '/modulos/dashboard/dashboard.html',   icon: 'grid'     },
    { label: 'Configurações',  href: '#',                                   icon: 'settings' },
  ];

  /* ── Ícones SVG ── */
  const ICONS = {
    grid: `<svg viewBox="0 0 20 20" fill="currentColor">
             <path d="M3 3h6v6H3zm8 0h6v6h-6zM3 11h6v6H3zm8 0h6v6h-6z"/>
           </svg>`,
    person: `<svg viewBox="0 0 20 20" fill="currentColor">
               <path d="M10 2a5 5 0 1 1 0 10A5 5 0 0 1 10 2zm0 12c-5 0-8 2.5-8 4v1h16v-1c0-1.5-3-4-8-4z"/>
             </svg>`,
    'file-text': `<svg viewBox="0 0 20 20" fill="currentColor">
                    <path d="M6 2h8a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zm1 4v2h6V6H7zm0 4v2h6v-2H7zm0 4v2h4v-2H7z"/>
                  </svg>`,
    calendar: `<svg viewBox="0 0 20 20" fill="currentColor">
                 <path d="M3 3h14v14H3zm2 2v10h10V5H5zm1.5 2h7v1.5h-7zm0 3h7v1.5h-7zm0 3h5v1.5h-5z"/>
               </svg>`,
    search: `<svg viewBox="0 0 20 20" fill="currentColor">
               <path d="M12.9 14.32a8 8 0 1 1 1.41-1.41l4.38 4.37-1.41 1.42-4.38-4.38zM8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12z"/>
             </svg>`,
    settings: `<svg viewBox="0 0 20 20" fill="currentColor">
                 <path d="M10 2a8 8 0 1 1 0 16A8 8 0 0 1 10 2zm.75 5.25h-1.5v4l3.5 2 .75-1.3-2.75-1.6V7.25z"/>
               </svg>`,
  };

  /* ── Seleciona nav pelo tipo de usuário ── */
  function getNavItems(tipoUsuario) {
    switch (tipoUsuario) {
      case 'psicologo':  return NAV_PSICOLOGO;
      case 'estudante':  return NAV_ESTUDANTE;
      case 'paciente':   return NAV_PACIENTE;
      case 'faculdade':  return NAV_FACULDADE;
      default:           return NAV_PSICOLOGO;
    }
  }

  /* ── Marca item ativo pela URL atual ── */
  function isActive(href) {
    if (href === '#') return false;
    return window.location.pathname === href ||
           window.location.pathname.endsWith(href.split('/').pop());
  }

  /* ── Gera iniciais a partir do nome ── */
  function iniciais(nome) {
    return (nome || '?')
      .split(' ')
      .slice(0, 2)
      .map(n => n[0])
      .join('')
      .toUpperCase();
  }

  /* ── Renderiza a sidebar ── */
  function renderSidebar() {
    const aside = document.getElementById('sidebar');
    if (!aside) return;

    // Lê sessão
    const sessionRaw = sessionStorage.getItem('usuarioCorrente');
    const session     = sessionRaw ? JSON.parse(sessionRaw) : null;
    const nome        = session?.nome || session?.login || 'Usuário';
    const tipo        = session?.tipoUsuario || 'psicologo';

    const navItems = getNavItems(tipo);

    const navHTML = navItems.map(item => `
      <a href="${item.href}" class="nav-item ${isActive(item.href) ? 'active' : ''}">
        ${ICONS[item.icon] || ''}
        ${item.label}
      </a>
    `).join('');

    aside.innerHTML = `
      <div class="sidebar-logo">
        <div class="logo-dot">P</div>
        <span class="logo-text">PSYCHE</span>
      </div>

      <nav class="sidebar-nav">
        ${navHTML}
      </nav>

      <div class="sidebar-footer">
        <div class="avatar-circle">${iniciais(nome)}</div>
        <span class="sidebar-username" id="sidebarName">${nome}</span>
        <span class="sidebar-logout" onclick="logoutUser()" title="Sair">✕</span>
      </div>
    `;
  }

  /* ── Roda após o DOM estar pronto ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderSidebar);
  } else {
    renderSidebar();
  }

})();
