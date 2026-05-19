figma.showUI(__html__, { width: 340, height: 200 });

figma.ui.onmessage = async (msg) => {
  if (msg.type !== 'build') return;
  const prog = (t, p) => figma.ui.postMessage({ type: 'progress', text: t, pct: p });
  const done = (t) => figma.ui.postMessage({ type: 'done', text: t });
  const err  = (t) => figma.ui.postMessage({ type: 'error', text: t });

  try {

    // ── LOAD FONTS ────────────────────────────────────────────
    prog('Loading fonts…', 5);
    await Promise.all([
      figma.loadFontAsync({ family: 'Nunito Sans', style: 'Regular' }),
      figma.loadFontAsync({ family: 'Nunito Sans', style: 'SemiBold' }),
      figma.loadFontAsync({ family: 'Nunito Sans', style: 'Bold' }),
      figma.loadFontAsync({ family: 'Nunito Sans', style: 'ExtraBold' }),
      figma.loadFontAsync({ family: 'Material Symbols Rounded', style: 'Regular' }),
    ]);
    prog('Fonts loaded.', 10);

    // ── CANVAS TOKENS ─────────────────────────────────────────
    const C = {
      pageBg:       { r:0.973, g:0.976, b:1.000 },  // #f8f9ff
      white:        { r:1,     g:1,     b:1     },  // #ffffff
      headerBg:     { r:0.992, g:0.992, b:1.000 },  // #fdfdff
      ink:          { r:0.208, g:0.200, b:0.192 },  // #353331
      ink2:         { r:0.420, g:0.412, b:0.400 },  // #6b6966
      ink3:         { r:0.639, g:0.631, b:0.624 },  // #a3a19f
      blue:         { r:0,     g:0.200, b:1     },  // #0033ff
      blueDk:       { r:0.067, g:0.051, b:0.506 },  // #110081
      blueLt:       { r:0.902, g:0.941, b:1.000 },  // #e6f0ff
      blue100:      { r:0.843, g:0.914, b:1.000 },  // #d7e9ff
      blue200:      { r:0.706, g:0.820, b:1.000 },  // #b4d1ff
      border:       { r:0.878, g:0.867, b:0.855 },  // #e0ddda
      borderSub:    { r:0.949, g:0.941, b:0.933 },  // #f2f0ee
      tableBrd:     { r:0.859, g:0.867, b:0.914 },  // #dbdde9
      thBg:         { r:0.949, g:0.941, b:0.933 },  // #f2f0ee
      rowHov:       { r:0.984, g:0.980, b:0.976 },  // #fbfaf9
      rowSel:       { r:0.902, g:0.941, b:1.000 },  // #e6f0ff
      green:        { r:0,     g:0.455, b:0.302 },  // #007442
      greenBg:      { r:0.929, g:0.953, b:0.910 },  // #edf3e8
      greenDk:      { r:0,     g:0.259, b:0.149 },  // #004226
      greenMid:     { r:0.690, g:0.976, b:0.859 },  // #b0f9db
      amber:        { r:0.506, g:0.396, b:0.024 },  // #816506
      amberBg:      { r:0.973, g:0.914, b:0.702 },  // #f8e9b3
      red:          { r:0.784, g:0.200, b:0.200 },  // #c83333
      redBg:        { r:0.992, g:0.929, b:0.910 },  // #fdede8
      tealBg:       { r:0.867, g:0.992, b:0.984 },  // #ddfdfb
      teal:         { r:0,     g:0.184, b:0.196 },  // #002f32
      tealBrd:      { r:0.075, g:0.784, b:0.643 },  // #13c8a4
      purple50:     { r:0.961, g:0.941, b:1.000 },  // #f5f0ff
      purple200:    { r:0.812, g:0.729, b:1.000 },  // #cfbaff
      purple600:    { r:0.510, g:0.337, b:0.906 },  // #8256e7
      purple900:    { r:0.247, g:0.173, b:0.420 },  // #3f2c6b
      // Negotiation stage fills
      stTestBg:     { r:0.949, g:0.941, b:0.933 },
      stTestInk:    { r:0.329, g:0.322, b:0.314 },
      stCpBg:       { r:0.902, g:0.941, b:1.000 },
      stCpInk:      { r:0.067, g:0.051, b:0.506 },
      stPpBg:       { r:0.961, g:0.941, b:1.000 },
      stPpInk:      { r:0.247, g:0.173, b:0.420 },
      stFinBg:      { r:0.929, g:0.953, b:0.910 },
      stFinInk:     { r:0,     g:0.259, b:0.149 },
    };

    const solid = (c, o = 1) => [{ type: 'SOLID', color: c, opacity: o }];
    const noFill = [];
    const S = (c, w = 1) => [{ type: 'SOLID', color: c, strokeWeight: w }];

    // ── HELPERS ───────────────────────────────────────────────
    function txt(content, size, weight, color, opts = {}) {
      const t = figma.createText();
      t.characters = content;
      t.fontSize = size;
      t.fontName = { family: 'Nunito Sans', style: weight };
      t.fills = solid(color);
      if (opts.width) { t.textAutoResize = 'HEIGHT'; t.resize(opts.width, 1); }
      else t.textAutoResize = 'WIDTH_AND_HEIGHT';
      if (opts.lineHeight) t.lineHeight = { value: opts.lineHeight, unit: 'PIXELS' };
      if (opts.opacity !== undefined) t.opacity = opts.opacity;
      return t;
    }

    function icon(name, size, color) {
      const t = figma.createText();
      t.characters = name;
      t.fontSize = size;
      t.fontName = { family: 'Material Symbols Rounded', style: 'Regular' };
      t.fills = solid(color);
      t.textAutoResize = 'WIDTH_AND_HEIGHT';
      return t;
    }

    function hbox(gap = 0, name = '') {
      const f = figma.createFrame();
      f.layoutMode = 'HORIZONTAL';
      f.primaryAxisSizingMode = 'AUTO';
      f.counterAxisSizingMode = 'AUTO';
      f.itemSpacing = gap;
      f.fills = noFill;
      f.name = name || 'HBox';
      return f;
    }

    function vbox(gap = 0, name = '') {
      const f = figma.createFrame();
      f.layoutMode = 'VERTICAL';
      f.primaryAxisSizingMode = 'AUTO';
      f.counterAxisSizingMode = 'AUTO';
      f.itemSpacing = gap;
      f.fills = noFill;
      f.name = name || 'VBox';
      return f;
    }

    function card(w, name = 'Card') {
      const f = figma.createFrame();
      f.name = name;
      f.layoutMode = 'VERTICAL';
      f.primaryAxisSizingMode = 'AUTO';
      f.counterAxisSizingMode = 'FIXED';
      f.resize(w, 100);
      f.fills = solid(C.white);
      f.strokes = S(C.border);
      f.strokeWeight = 1;
      f.cornerRadius = 8;
      f.clipsContent = true;
      return f;
    }

    function divider(w) {
      const r = figma.createRectangle();
      r.name = 'Divider';
      r.resize(w, 1);
      r.fills = solid(C.border);
      return r;
    }

    function badge(text, bgColor, inkColor, radius = 100) {
      const b = figma.createFrame();
      b.name = `Badge / ${text}`;
      b.layoutMode = 'HORIZONTAL';
      b.primaryAxisSizingMode = 'AUTO';
      b.counterAxisSizingMode = 'AUTO';
      b.paddingLeft = 8; b.paddingRight = 8;
      b.paddingTop = 3; b.paddingBottom = 3;
      b.cornerRadius = radius;
      b.fills = solid(bgColor);
      b.strokes = S(inkColor, 1);
      b.strokeWeight = 1;
      b.strokeAlign = 'INSIDE';
      const t = txt(text, 11, 'Bold', inkColor);
      b.appendChild(t);
      return b;
    }

    function pill(icn, label, bgColor, inkColor) {
      const b = figma.createFrame();
      b.name = `Pill / ${label}`;
      b.layoutMode = 'HORIZONTAL';
      b.primaryAxisSizingMode = 'AUTO';
      b.counterAxisSizingMode = 'AUTO';
      b.paddingLeft = 8; b.paddingRight = 8;
      b.paddingTop = 4; b.paddingBottom = 4;
      b.itemSpacing = 4;
      b.cornerRadius = 4;
      b.fills = solid(bgColor);
      b.strokes = S(inkColor, 1);
      b.strokeWeight = 1;
      b.strokeAlign = 'INSIDE';
      if (icn) b.appendChild(icon(icn, 14, inkColor));
      b.appendChild(txt(label, 12, 'SemiBold', inkColor));
      return b;
    }

    // ── NAVIGATION (40px, matches Canvas exactly) ──────────────
    function buildNav(width) {
      const nav = figma.createFrame();
      nav.name = 'Navigation';
      nav.layoutMode = 'HORIZONTAL';
      nav.primaryAxisSizingMode = 'FIXED';
      nav.counterAxisSizingMode = 'FIXED';
      nav.resize(width, 40);
      nav.fills = solid(C.white);
      nav.paddingLeft = 12; nav.paddingRight = 16;
      nav.primaryAxisAlignItems = 'SPACE_BETWEEN';
      nav.counterAxisAlignItems = 'CENTER';

      // Logo + nav links
      const left = hbox(0, 'Nav Left');
      left.counterAxisAlignItems = 'CENTER';

      // Logo
      const logoBox = hbox(8, 'Logo');
      logoBox.paddingLeft = 8; logoBox.paddingRight = 8;
      logoBox.paddingTop = 4; logoBox.paddingBottom = 4;
      logoBox.counterAxisAlignItems = 'CENTER';
      const logoIcon = figma.createFrame();
      logoIcon.resize(24, 24); logoIcon.cornerRadius = 4;
      logoIcon.fills = solid(C.blue);
      logoIcon.name = 'App Logo';
      logoBox.appendChild(logoIcon);
      logoBox.appendChild(txt('Contract Modeling', 14, 'Bold', C.ink));
      left.appendChild(logoBox);

      // Nav links
      const navLinks = hbox(0, 'Nav Links');
      navLinks.paddingLeft = 24; navLinks.paddingRight = 24;
      navLinks.counterAxisAlignItems = 'STRETCH';

      const links = [
        { label: 'Scenario', active: false },
        { label: 'Scenarios', active: true },
        { label: 'Ratesheet History', active: false },
        { label: 'Ratesheet Maintenance', active: false },
        { label: 'Admin Access', active: false },
      ];
      for (const link of links) {
        const lf = vbox(0, `NavLink / ${link.label}`);
        lf.paddingLeft = 16; lf.paddingRight = 16;
        lf.primaryAxisSizingMode = 'FIXED';
        lf.resize(1, 40);
        lf.primaryAxisAlignItems = 'SPACE_BETWEEN';

        const textRow = hbox(4, 'Text');
        textRow.paddingTop = 12; textRow.paddingBottom = link.active ? 2 : 4;
        textRow.counterAxisAlignItems = 'CENTER';
        textRow.appendChild(txt(link.label, 14, 'SemiBold', link.active ? C.blue : C.ink));
        lf.appendChild(textRow);

        const line = figma.createRectangle();
        line.name = 'Active Line';
        line.resize(1, 2);
        line.fills = solid(link.active ? C.blue : C.white);
        lf.appendChild(line);
        navLinks.appendChild(lf);
      }
      left.appendChild(navLinks);
      nav.appendChild(left);

      // Right: Help + Avatar
      const right = hbox(16, 'Nav Right');
      right.counterAxisAlignItems = 'CENTER';
      right.appendChild(icon('search', 18, C.ink2));
      right.appendChild(txt('Help', 14, 'SemiBold', C.ink));
      right.appendChild(icon('notifications', 18, C.ink2));
      const av = figma.createFrame();
      av.resize(28, 28); av.cornerRadius = 1000;
      av.fills = solid(C.blue); av.name = 'Avatar';
      av.layoutMode = 'HORIZONTAL';
      av.primaryAxisAlignItems = 'CENTER';
      av.counterAxisAlignItems = 'CENTER';
      av.primaryAxisSizingMode = 'FIXED';
      av.counterAxisSizingMode = 'FIXED';
      av.appendChild(txt('GX', 11, 'Bold', C.white));
      right.appendChild(av);
      nav.appendChild(right);

      return nav;
    }

    // ── SCREEN HEADER (96px, matches Canvas exactly) ────────────
    function buildScreenHeader(width) {
      const hdr = figma.createFrame();
      hdr.name = 'Screen Header/Default';
      hdr.layoutMode = 'HORIZONTAL';
      hdr.primaryAxisSizingMode = 'FIXED';
      hdr.counterAxisSizingMode = 'FIXED';
      hdr.resize(width, 96);
      hdr.fills = solid(C.headerBg);
      hdr.paddingLeft = 16; hdr.paddingRight = 16;
      hdr.paddingTop = 16; hdr.paddingBottom = 16;
      hdr.itemSpacing = 48;
      hdr.counterAxisAlignItems = 'CENTER';
      hdr.strokes = S(C.border);
      hdr.strokeAlign = 'OUTSIDE';

      // Left — title block
      const left = vbox(4, 'Titles');
      left.primaryAxisSizingMode = 'AUTO';
      const titleRow = hbox(8, 'Main Title');
      titleRow.counterAxisAlignItems = 'CENTER';
      titleRow.appendChild(txt('Scenario Dashboard', 28, 'Bold', C.ink));
      left.appendChild(titleRow);
      left.appendChild(txt('My Market · South Central Region', 14, 'Regular', C.ink2));
      hdr.appendChild(left);

      // Metadata boxes — 22px/ExtraBold value, 14px/SemiBold label
      const metas = [
        { val: '12',  lbl: 'Facilities',       color: C.ink },
        { val: '47',  lbl: 'Team Scenarios',   color: C.ink },
        { val: '9',   lbl: 'Active Proposals', color: C.blue },
        { val: '3',   lbl: 'Finals This Qtr',  color: C.green },
        { val: '5',   lbl: 'Renewals <90 days', color: C.amber },
      ];
      for (const m of metas) {
        const mb = vbox(2, `Meta / ${m.lbl}`);
        mb.counterAxisAlignItems = 'MIN';
        const valT = txt(m.val, 22, 'ExtraBold', m.color);
        valT.lineHeight = { value: 28, unit: 'PIXELS' };
        mb.appendChild(valT);
        mb.appendChild(txt(m.lbl, 12, 'SemiBold', C.ink2));
        hdr.appendChild(mb);
      }

      return hdr;
    }

    // ── RENEWAL CARD ──────────────────────────────────────────
    function buildRenewalCard(w, facility, daysLeft, urgency, scenarios) {
      // urgency: 'critical' | 'warning' | 'normal'
      const urgencyColor = urgency === 'critical' ? C.red : urgency === 'warning' ? C.amber : C.ink2;
      const urgencyBg    = urgency === 'critical' ? C.redBg : urgency === 'warning' ? C.amberBg : C.borderSub;
      const urgencyBrd   = urgency === 'critical' ? C.red : urgency === 'warning' ? C.amber : C.border;

      const c = figma.createFrame();
      c.name = `Renewal Card / ${facility}`;
      c.layoutMode = 'VERTICAL';
      c.primaryAxisSizingMode = 'AUTO';
      c.counterAxisSizingMode = 'FIXED';
      c.resize(w, 100);
      c.fills = solid(C.white);
      c.strokes = S(urgency !== 'normal' ? urgencyBrd : C.border);
      c.strokeWeight = 1;
      c.strokeAlign = 'INSIDE';
      c.cornerRadius = 8;
      c.clipsContent = true;

      // Header strip
      const strip = figma.createFrame();
      strip.name = 'Card Header';
      strip.layoutMode = 'HORIZONTAL';
      strip.primaryAxisSizingMode = 'FIXED';
      strip.counterAxisSizingMode = 'AUTO';
      strip.resize(w, 10);
      strip.paddingLeft = 12; strip.paddingRight = 12;
      strip.paddingTop = 8; strip.paddingBottom = 8;
      strip.itemSpacing = 8;
      strip.fills = solid(urgencyBg);
      strip.counterAxisAlignItems = 'CENTER';
      strip.primaryAxisAlignItems = 'SPACE_BETWEEN';

      const nameRow = hbox(6, 'Facility Name');
      nameRow.counterAxisAlignItems = 'CENTER';
      nameRow.appendChild(icon('local_hospital', 14, urgencyColor));
      nameRow.appendChild(txt(facility, 13, 'Bold', C.ink));
      strip.appendChild(nameRow);

      const daysBadge = badge(
        daysLeft <= 30 ? `${daysLeft}d` : `${daysLeft}d`,
        urgencyBg, urgencyColor
      );
      strip.appendChild(daysBadge);
      c.appendChild(strip);

      // Renewal date row
      const dateRow = hbox(4, 'Renewal Row');
      dateRow.paddingLeft = 12; dateRow.paddingRight = 12;
      dateRow.paddingTop = 6; dateRow.paddingBottom = 2;
      dateRow.counterAxisAlignItems = 'CENTER';
      dateRow.appendChild(icon('event', 13, C.ink3));
      dateRow.appendChild(txt('Contract renewal', 11, 'SemiBold', C.ink3));
      dateRow.appendChild(txt(daysLeft <= 30 ? `in ${daysLeft} days` : `in ${daysLeft} days`, 11, 'Bold', urgencyColor));
      c.appendChild(dateRow);

      // Scenarios divider
      c.appendChild((() => {
        const d = figma.createRectangle();
        d.resize(w - 24, 1);
        d.fills = solid(C.borderSub);
        d.name = 'Divider';
        const wrap = figma.createFrame();
        wrap.layoutMode = 'HORIZONTAL';
        wrap.primaryAxisSizingMode = 'FIXED';
        wrap.counterAxisSizingMode = 'AUTO';
        wrap.resize(w, 1);
        wrap.paddingLeft = 12; wrap.paddingRight = 12;
        wrap.paddingTop = 6; wrap.paddingBottom = 0;
        wrap.fills = noFill;
        wrap.appendChild(d);
        return wrap;
      })());

      // Scenarios list
      for (const s of scenarios) {
        const sr = figma.createFrame();
        sr.name = `Scenario Row / ${s.name}`;
        sr.layoutMode = 'VERTICAL';
        sr.primaryAxisSizingMode = 'AUTO';
        sr.counterAxisSizingMode = 'FIXED';
        sr.resize(w, 100);
        sr.paddingLeft = 12; sr.paddingRight = 12;
        sr.paddingTop = 6; sr.paddingBottom = 6;
        sr.itemSpacing = 4;
        sr.fills = noFill;

        // Top row: name + status badge
        const topRow = hbox(6, 'Scenario Top');
        topRow.counterAxisAlignItems = 'CENTER';
        topRow.primaryAxisSizingMode = 'FIXED';
        topRow.resize(w - 24, 10);
        topRow.primaryAxisAlignItems = 'SPACE_BETWEEN';

        const nameVer = hbox(6, 'Name + Version');
        nameVer.counterAxisAlignItems = 'CENTER';
        const snTxt = txt(s.name, 12, 'Bold', C.blue);
        nameVer.appendChild(snTxt);
        if (s.latest) {
          const latestBadge = badge('● Latest', C.greenBg, C.greenDk);
          nameVer.appendChild(latestBadge);
        }
        if (s.combined) {
          const combBadge = badge('⛓ Combined', C.purple50, C.purple600);
          nameVer.appendChild(combBadge);
        }
        topRow.appendChild(nameVer);

        // Status badge
        const statusColors = {
          'Test':              { bg: C.stTestBg, ink: C.stTestInk },
          'Cigna Proposal':    { bg: C.stCpBg,   ink: C.stCpInk   },
          'Provider Proposal': { bg: C.stPpBg,   ink: C.stPpInk   },
          'Final':             { bg: C.stFinBg,  ink: C.stFinInk  },
        };
        const sc = statusColors[s.status] || statusColors['Test'];
        topRow.appendChild(badge(s.status, sc.bg, sc.ink));
        sr.appendChild(topRow);

        // Meta row: creator + RSH + note
        const metaRow = hbox(10, 'Scenario Meta');
        metaRow.counterAxisAlignItems = 'CENTER';

        // Creator avatar
        const avRow = hbox(4, 'Creator');
        avRow.counterAxisAlignItems = 'CENTER';
        const avDot = figma.createFrame();
        avDot.resize(16, 16); avDot.cornerRadius = 100;
        avDot.fills = solid(s.avColor || C.blue);
        avDot.name = 'Avatar Dot';
        avDot.layoutMode = 'HORIZONTAL';
        avDot.primaryAxisAlignItems = 'CENTER';
        avDot.counterAxisAlignItems = 'CENTER';
        avDot.primaryAxisSizingMode = 'FIXED';
        avDot.counterAxisSizingMode = 'FIXED';
        avDot.appendChild(txt(s.initials, 8, 'Bold', C.white));
        avRow.appendChild(avDot);
        avRow.appendChild(txt(s.creator, 11, 'SemiBold', C.ink2));
        metaRow.appendChild(avRow);

        // RSH
        const rshBadge = badge(
          s.rsh ? '✓ RSH' : '— RSH',
          s.rsh ? C.greenBg : C.thBg,
          s.rsh ? C.green : C.ink3
        );
        metaRow.appendChild(rshBadge);

        // Claim type
        const ctColors = {
          'ASC':          { bg: C.amberBg, ink: C.amber },
          'Facility':     { bg: C.tealBg,  ink: C.teal  },
          'Professional': { bg: C.purple50,ink: C.purple900 },
        };
        for (const ct of (s.claimTypes || [])) {
          const ctc = ctColors[ct] || { bg: C.borderSub, ink: C.ink2 };
          metaRow.appendChild(badge(ct, ctc.bg, ctc.ink, 4));
        }

        sr.appendChild(metaRow);

        // Note
        if (s.note) {
          const noteBg = figma.createFrame();
          noteBg.name = 'Note';
          noteBg.layoutMode = 'HORIZONTAL';
          noteBg.primaryAxisSizingMode = 'FIXED';
          noteBg.counterAxisSizingMode = 'AUTO';
          noteBg.resize(w - 24, 10);
          noteBg.paddingLeft = 8; noteBg.paddingRight = 8;
          noteBg.paddingTop = 4; noteBg.paddingBottom = 4;
          noteBg.fills = solid(C.thBg);
          noteBg.cornerRadius = 4;
          const noteT = txt(s.note, 11, 'Regular', C.ink2, { width: w - 44 });
          noteBg.appendChild(noteT);
          sr.appendChild(noteBg);
        }

        // Row divider
        const rd = figma.createRectangle();
        rd.resize(w - 24, 1);
        rd.fills = solid(C.borderSub);
        rd.name = 'Row Divider';
        const rdWrap = figma.createFrame();
        rdWrap.layoutMode = 'HORIZONTAL'; rdWrap.fills = noFill;
        rdWrap.primaryAxisSizingMode = 'FIXED';
        rdWrap.counterAxisSizingMode = 'AUTO';
        rdWrap.resize(w, 1);
        rdWrap.paddingLeft = 12;
        rdWrap.appendChild(rd);
        sr.appendChild(rdWrap);

        c.appendChild(sr);
      }

      // Card footer: quick action
      const footer = figma.createFrame();
      footer.name = 'Card Footer';
      footer.layoutMode = 'HORIZONTAL';
      footer.primaryAxisSizingMode = 'FIXED';
      footer.counterAxisSizingMode = 'AUTO';
      footer.resize(w, 10);
      footer.paddingLeft = 12; footer.paddingRight = 12;
      footer.paddingTop = 8; footer.paddingBottom = 8;
      footer.fills = solid(C.thBg);
      footer.itemSpacing = 8;
      footer.counterAxisAlignItems = 'CENTER';

      const combineBtn = figma.createFrame();
      combineBtn.name = 'Combine Button';
      combineBtn.layoutMode = 'HORIZONTAL';
      combineBtn.primaryAxisSizingMode = 'AUTO';
      combineBtn.counterAxisSizingMode = 'AUTO';
      combineBtn.paddingLeft = 10; combineBtn.paddingRight = 10;
      combineBtn.paddingTop = 5; combineBtn.paddingBottom = 5;
      combineBtn.itemSpacing = 4; combineBtn.cornerRadius = 4;
      combineBtn.fills = solid(C.blue);
      combineBtn.counterAxisAlignItems = 'CENTER';
      combineBtn.appendChild(icon('link', 14, C.white));
      combineBtn.appendChild(txt('Combine Scenarios', 12, 'Bold', C.white));
      footer.appendChild(combineBtn);

      footer.appendChild(txt(`${scenarios.length} scenario${scenarios.length !== 1 ? 's' : ''} attached`, 11, 'Regular', C.ink3));
      c.appendChild(footer);

      return c;
    }

    // ── SECTION HEADER ────────────────────────────────────────
    function sectionHeader(width, title, subtitle, iconName) {
      const row = figma.createFrame();
      row.name = `Section Header / ${title}`;
      row.layoutMode = 'HORIZONTAL';
      row.primaryAxisSizingMode = 'FIXED';
      row.counterAxisSizingMode = 'AUTO';
      row.resize(width, 10);
      row.paddingTop = 4; row.paddingBottom = 8;
      row.itemSpacing = 8;
      row.fills = noFill;
      row.counterAxisAlignItems = 'CENTER';
      row.primaryAxisAlignItems = 'SPACE_BETWEEN';

      const left = hbox(8, 'Title Group');
      left.counterAxisAlignItems = 'CENTER';
      if (iconName) left.appendChild(icon(iconName, 18, C.blue));
      const titleVbox = vbox(2, 'Titles');
      titleVbox.appendChild(txt(title, 16, 'Bold', C.ink));
      if (subtitle) titleVbox.appendChild(txt(subtitle, 12, 'Regular', C.ink2));
      left.appendChild(titleVbox);
      row.appendChild(left);

      const seeAll = hbox(4, 'See All');
      seeAll.counterAxisAlignItems = 'CENTER';
      seeAll.appendChild(txt('See all', 12, 'SemiBold', C.blue));
      seeAll.appendChild(icon('chevron_right', 14, C.blue));
      row.appendChild(seeAll);
      return row;
    }

    // ── ATTENTION STRIP ───────────────────────────────────────
    function buildAttentionStrip(width) {
      const strip = figma.createFrame();
      strip.name = 'Attention Strip';
      strip.layoutMode = 'HORIZONTAL';
      strip.primaryAxisSizingMode = 'FIXED';
      strip.counterAxisSizingMode = 'AUTO';
      strip.resize(width, 10);
      strip.paddingLeft = 24; strip.paddingRight = 24;
      strip.paddingTop = 10; strip.paddingBottom = 10;
      strip.itemSpacing = 8;
      strip.fills = solid(C.redBg);
      strip.strokes = S(C.red);
      strip.strokeWeight = 1;
      strip.strokeAlign = 'INSIDE';
      strip.counterAxisAlignItems = 'CENTER';

      const alerts = [
        { icon: 'warning', text: '3 provider proposals expire within 7 days — action required',       color: C.red   },
        { icon: 'upload',  text: '9 scenarios not yet pushed to RSH — including 3 Finals',            color: C.amber },
        { icon: 'event',   text: '5 facility renewals within 90 days — ensure scenarios are at Final', color: C.ink2  },
      ];

      for (const a of alerts) {
        const item = hbox(6, `Alert / ${a.text.slice(0,25)}`);
        item.counterAxisAlignItems = 'CENTER';
        item.paddingLeft = 10; item.paddingRight = 10;
        item.paddingTop = 4; item.paddingBottom = 4;
        item.fills = solid(C.white);
        item.cornerRadius = 4;
        item.strokes = S(a.icon === 'warning' ? C.red : C.border);
        item.strokeWeight = 1;
        item.strokeAlign = 'INSIDE';
        item.appendChild(icon(a.icon, 14, a.icon === 'warning' ? C.red : a.icon === 'upload' ? C.amber : C.ink3));
        item.appendChild(txt(a.text, 11, 'SemiBold', a.icon === 'warning' ? C.red : C.ink));
        strip.appendChild(item);
      }
      return strip;
    }

    // ── TABLE ROW ─────────────────────────────────────────────
    function tableRow(width, cells, isHeader = false) {
      const row = figma.createFrame();
      row.name = isHeader ? 'Table Header Row' : 'Table Row';
      row.layoutMode = 'HORIZONTAL';
      row.primaryAxisSizingMode = 'FIXED';
      row.counterAxisSizingMode = 'FIXED';
      row.resize(width, isHeader ? 36 : 52);
      row.fills = solid(isHeader ? C.thBg : C.white);
      row.strokes = S(C.borderSub);
      row.strokeWeight = 1;
      row.strokeAlign = 'OUTSIDE';
      row.counterAxisAlignItems = 'CENTER';

      const colWidths = [32, 280, 140, 120, 160, 110, 72, 120, 120, 80];
      const colAligns = ['CENTER','MIN','MIN','MIN','MIN','MIN','MIN','MIN','MIN','CENTER'];

      cells.forEach((cell, i) => {
        const w = colWidths[i] || 80;
        const cellF = figma.createFrame();
        cellF.name = `Cell / ${isHeader ? cell : i}`;
        cellF.layoutMode = 'HORIZONTAL';
        cellF.primaryAxisSizingMode = 'FIXED';
        cellF.counterAxisSizingMode = 'FIXED';
        cellF.resize(w, isHeader ? 36 : 52);
        cellF.fills = noFill;
        cellF.paddingLeft = i === 0 ? 0 : 10;
        cellF.paddingRight = 10;
        cellF.counterAxisAlignItems = 'CENTER';
        cellF.primaryAxisAlignItems = colAligns[i] === 'CENTER' ? 'CENTER' : 'MIN';

        if (typeof cell === 'string') {
          if (i === 0 && !isHeader) {
            const cb = figma.createEllipse();
            cb.resize(14, 14);
            cb.fills = solid(C.borderSub);
            cb.strokes = S(C.border);
            cb.strokeWeight = 1.5;
            cellF.appendChild(cb);
          } else if (isHeader && i === 0) {
            const cb = figma.createEllipse();
            cb.resize(14, 14);
            cb.fills = solid(C.borderSub);
            cb.strokes = S(C.ink2);
            cb.strokeWeight = 1.5;
            cellF.appendChild(cb);
          } else {
            const t = txt(cell, isHeader ? 11 : 13, isHeader ? 'Bold' : 'Regular',
                          isHeader ? C.ink2 : C.ink, { width: w - (i === 0 ? 0 : 20) });
            if (isHeader) t.textCase = 'UPPER';
            cellF.appendChild(t);
          }
        } else if (cell && typeof cell === 'object') {
          if (cell.type === 'name') {
            const vb = vbox(3, 'Name Cell');
            const top = hbox(6, 'Name Top');
            top.counterAxisAlignItems = 'CENTER';
            const nt = txt(cell.name, 13, 'Bold', C.blue, { width: 160 });
            top.appendChild(nt);
            if (cell.latest) top.appendChild(badge('● Latest', C.greenBg, C.greenDk));
            if (cell.combined) top.appendChild(badge('⛓', C.purple50, C.purple600));
            vb.appendChild(top);
            const meta = hbox(6, 'Meta');
            meta.counterAxisAlignItems = 'CENTER';
            meta.appendChild(txt(cell.id, 10, 'SemiBold', C.ink3));
            const av2 = figma.createFrame();
            av2.resize(14, 14); av2.cornerRadius = 100;
            av2.fills = solid(cell.avColor || C.blue);
            av2.layoutMode = 'HORIZONTAL'; av2.primaryAxisAlignItems = 'CENTER'; av2.counterAxisAlignItems = 'CENTER';
            av2.primaryAxisSizingMode = 'FIXED'; av2.counterAxisSizingMode = 'FIXED';
            av2.appendChild(txt(cell.initials, 7, 'Bold', C.white));
            meta.appendChild(av2);
            meta.appendChild(txt(cell.creator, 11, 'Regular', C.ink2));
            vb.appendChild(meta);
            if (cell.note) {
              const nb = figma.createFrame();
              nb.layoutMode = 'HORIZONTAL';
              nb.primaryAxisSizingMode = 'FIXED';
              nb.counterAxisSizingMode = 'AUTO';
              nb.resize(260, 10);
              nb.paddingLeft = 6; nb.paddingRight = 6;
              nb.paddingTop = 2; nb.paddingBottom = 2;
              nb.fills = solid(C.thBg);
              nb.cornerRadius = 3;
              nb.appendChild(txt(cell.note, 10, 'Regular', C.ink2, { width: 248 }));
              vb.appendChild(nb);
            }
            cellF.appendChild(vb);
          } else if (cell.type === 'status') {
            const statusColors = {
              'Test':              { bg: C.stTestBg, ink: C.stTestInk },
              'Cigna Proposal':    { bg: C.stCpBg,   ink: C.stCpInk   },
              'Provider Proposal': { bg: C.stPpBg,   ink: C.stPpInk   },
              'Final':             { bg: C.stFinBg,  ink: C.stFinInk  },
            };
            const sc = statusColors[cell.value] || statusColors['Test'];
            cellF.appendChild(badge(cell.value, sc.bg, sc.ink));
          } else if (cell.type === 'rsh') {
            cellF.appendChild(badge(cell.value ? '✓ Yes' : 'No', cell.value ? C.greenBg : C.thBg, cell.value ? C.green : C.ink3));
          } else if (cell.type === 'tags') {
            const tr = hbox(4, 'Tags');
            tr.counterAxisAlignItems = 'CENTER';
            for (const tag of cell.values) {
              tr.appendChild(badge(tag, C.rowSel, C.blue));
            }
            cellF.appendChild(tr);
          } else if (cell.type === 'claims') {
            const tr = hbox(4, 'Claims');
            tr.counterAxisAlignItems = 'CENTER';
            const ctColors = { 'ASC': {bg:C.amberBg,ink:C.amber}, 'Facility': {bg:C.tealBg,ink:C.teal}, 'Professional': {bg:C.purple50,ink:C.purple900} };
            for (const ct of cell.values) {
              const ctc = ctColors[ct] || { bg:C.borderSub, ink:C.ink2 };
              tr.appendChild(badge(ct, ctc.bg, ctc.ink, 4));
            }
            cellF.appendChild(tr);
          } else if (cell.type === 'date') {
            const vb = vbox(2, 'Date');
            vb.appendChild(txt(cell.date, 12, 'SemiBold', C.ink2));
            if (cell.time) vb.appendChild(txt(cell.time, 10, 'Regular', C.ink3));
            cellF.appendChild(vb);
          } else if (cell.type === 'action') {
            const ab = hbox(4, 'Actions');
            ab.counterAxisAlignItems = 'CENTER';
            const runBtn = figma.createFrame();
            runBtn.layoutMode = 'HORIZONTAL'; runBtn.primaryAxisAlignItems = 'CENTER'; runBtn.counterAxisAlignItems = 'CENTER';
            runBtn.primaryAxisSizingMode = 'FIXED'; runBtn.counterAxisSizingMode = 'FIXED';
            runBtn.resize(28, 28); runBtn.cornerRadius = 4; runBtn.fills = solid(C.thBg);
            runBtn.strokes = S(C.border); runBtn.strokeWeight = 1;
            runBtn.appendChild(icon('play_arrow', 16, C.ink2));
            ab.appendChild(runBtn);
            const moreBtn = figma.createFrame();
            moreBtn.layoutMode = 'HORIZONTAL'; moreBtn.primaryAxisAlignItems = 'CENTER'; moreBtn.counterAxisAlignItems = 'CENTER';
            moreBtn.primaryAxisSizingMode = 'FIXED'; moreBtn.counterAxisSizingMode = 'FIXED';
            moreBtn.resize(28, 28); moreBtn.cornerRadius = 4; moreBtn.fills = solid(C.thBg);
            moreBtn.strokes = S(C.border); moreBtn.strokeWeight = 1;
            moreBtn.appendChild(icon('more_vert', 16, C.ink2));
            ab.appendChild(moreBtn);
            cellF.appendChild(ab);
          }
        }
        row.appendChild(cellF);
      });
      return row;
    }

    // ══════════════════════════════════════════════════════════
    //  BUILD THE PAGE
    // ══════════════════════════════════════════════════════════
    prog('Creating page…', 15);

    // Find or create "Scenario Dashboard" page
    let dashPage = figma.root.children.find(p => p.name === 'Scenario Dashboard');
    if (!dashPage) {
      dashPage = figma.root.children.find(p => p.name === 'Page 1');
      // Clone by inserting new page
      dashPage = figma.createPage();
      dashPage.name = 'Scenario Dashboard';
    } else {
      // Clear existing frames
      for (const child of [...dashPage.children]) child.remove();
    }
    figma.currentPage = dashPage;

    const W = 1440;

    // Create main frame
    const main = figma.createFrame();
    main.name = 'Scenario Dashboard';
    main.layoutMode = 'VERTICAL';
    main.primaryAxisSizingMode = 'AUTO';
    main.counterAxisSizingMode = 'FIXED';
    main.resize(W, 100);
    main.fills = solid(C.pageBg);
    main.itemSpacing = 0;
    main.x = 0; main.y = 0;

    prog('Building navigation…', 20);
    main.appendChild(buildNav(W));

    prog('Building screen header…', 25);
    main.appendChild(buildScreenHeader(W));

    // Attention strip
    prog('Building attention strip…', 30);
    main.appendChild(buildAttentionStrip(W));

    // ── CONTENT AREA (24px padding) ───────────────────────────
    const content = figma.createFrame();
    content.name = 'Content Area';
    content.layoutMode = 'VERTICAL';
    content.primaryAxisSizingMode = 'AUTO';
    content.counterAxisSizingMode = 'FIXED';
    content.resize(W, 100);
    content.paddingLeft = 24; content.paddingRight = 24;
    content.paddingTop = 20; content.paddingBottom = 32;
    content.itemSpacing = 20;
    content.fills = noFill;

    // ── SECTION 1: UPCOMING RENEWALS ─────────────────────────
    prog('Building renewal cards…', 40);
    content.appendChild(sectionHeader(W - 48, 'Upcoming Renewals', '5 facilities in my market renewing within 90 days', 'event'));

    const renewalRow = figma.createFrame();
    renewalRow.name = 'Renewal Cards Row';
    renewalRow.layoutMode = 'HORIZONTAL';
    renewalRow.primaryAxisSizingMode = 'FIXED';
    renewalRow.counterAxisSizingMode = 'AUTO';
    renewalRow.resize(W - 48, 100);
    renewalRow.itemSpacing = 12;
    renewalRow.fills = noFill;

    const cardW = Math.floor((W - 48 - 48) / 4);

    const renewalData = [
      {
        facility: 'Piedmont Healthcare — TX',
        daysLeft: 18,
        urgency: 'critical',
        scenarios: [
          { name: 'TX-Austin ASC+Fac Combined v3', status: 'Provider Proposal', creator: 'Skander B.', initials: 'SB', avColor: {r:0.22,g:0.47,b:0.86}, rsh: true, latest: true, combined: true, claimTypes: ['ASC','Facility'], note: 'Updated rate assumptions, outliers removed' },
          { name: 'TX-Austin ASC Base v2',          status: 'Cigna Proposal',   creator: 'Skander B.', initials: 'SB', avColor: {r:0.22,g:0.47,b:0.86}, rsh: true, latest: false, combined: false, claimTypes: ['ASC'], note: 'Base run before outlier removal' },
        ]
      },
      {
        facility: 'Baylor Scott & White — TX',
        daysLeft: 34,
        urgency: 'warning',
        scenarios: [
          { name: 'TX-Dallas Facility v3', status: 'Cigna Proposal', creator: 'Marcus C.', initials: 'MC', avColor: {r:0.51,g:0.33,b:0.91}, rsh: false, latest: true, combined: false, claimTypes: ['Facility'], note: 'Revised LOB split post-compliance review' },
          { name: 'TX-Dallas Prof v2',     status: 'Test',           creator: 'Marcus C.', initials: 'MC', avColor: {r:0.51,g:0.33,b:0.91}, rsh: false, latest: true, combined: false, claimTypes: ['Professional'], note: 'Test run, awaiting approval' },
        ]
      },
      {
        facility: 'Providence Health — WA',
        daysLeft: 47,
        urgency: 'warning',
        scenarios: [
          { name: 'WA-Seattle Prof+Fac v2', status: 'Final', creator: 'Priya N.', initials: 'PN', avColor: {r:0,g:0.45,b:0.30}, rsh: true, latest: true, combined: true, claimTypes: ['Professional','Facility'], note: 'Finalized — all terms agreed' },
        ]
      },
      {
        facility: 'Atrium Health — NC',
        daysLeft: 72,
        urgency: 'normal',
        scenarios: [
          { name: 'NC-Charlotte Facility v1', status: 'Test', creator: 'Derek W.', initials: 'DW', avColor: {r:0.51,g:0.40,b:0.02}, rsh: false, latest: true, combined: false, claimTypes: ['Facility'], note: 'First run, conservative rate assumptions' },
        ]
      },
    ];

    for (const rd of renewalData) {
      renewalRow.appendChild(buildRenewalCard(cardW, rd.facility, rd.daysLeft, rd.urgency, rd.scenarios));
    }
    content.appendChild(renewalRow);

    // ── SECTION DIVIDER ───────────────────────────────────────
    content.appendChild(divider(W - 48));

    // ── SECTION 2: RECENT TEAM SCENARIOS ─────────────────────
    prog('Building team activity row…', 55);
    content.appendChild(sectionHeader(W - 48, 'Recent Team Activity', 'Latest scenario updates across all team members', 'group'));

    // Team member quick stats row
    const teamRow = figma.createFrame();
    teamRow.name = 'Team Stats Row';
    teamRow.layoutMode = 'HORIZONTAL';
    teamRow.primaryAxisSizingMode = 'FIXED';
    teamRow.counterAxisSizingMode = 'AUTO';
    teamRow.resize(W - 48, 100);
    teamRow.itemSpacing = 12;
    teamRow.fills = noFill;

    const memberStatW = Math.floor((W - 48 - 48) / 5);
    const memberData = [
      { initials: 'SB', name: 'Skander B.', role: 'TX Region', count: 8, combined: 3, status: 'Proposal', avColor: {r:0.22,g:0.47,b:0.86}, note: 'TX-Austin ASC v3 — rates updated' },
      { initials: 'PN', name: 'Priya N.',   role: 'WA Region', count: 6, combined: 2, status: 'Final',    avColor: {r:0,g:0.45,b:0.30},     note: 'WA-Seattle Combined — finalized' },
      { initials: 'MC', name: 'Marcus C.',  role: 'GA Region', count:11, combined: 1, status: 'Proposal', avColor: {r:0.51,g:0.33,b:0.91},  note: 'GA-Atlanta Facility v4 — LOB revised' },
      { initials: 'AT', name: 'Aisha T.',   role: 'NY Region', count: 5, combined: 0, status: 'Test',     avColor: {r:0,g:0.56,b:0.51},     note: 'NY-Albany — awaiting network data' },
      { initials: 'DW', name: 'Derek W.',   role: 'GP Region', count: 4, combined: 1, status: 'Proposal', avColor: {r:0.51,g:0.40,b:0.02},  note: 'ND-Fargo ASC v1 — first run' },
    ];

    for (const m of memberData) {
      const mc = figma.createFrame();
      mc.name = `Member Card / ${m.name}`;
      mc.layoutMode = 'VERTICAL';
      mc.primaryAxisSizingMode = 'AUTO';
      mc.counterAxisSizingMode = 'FIXED';
      mc.resize(memberStatW, 100);
      mc.paddingLeft = 12; mc.paddingRight = 12;
      mc.paddingTop = 10; mc.paddingBottom = 10;
      mc.itemSpacing = 8;
      mc.fills = solid(C.white);
      mc.strokes = S(C.border); mc.strokeWeight = 1; mc.strokeAlign = 'INSIDE';
      mc.cornerRadius = 8;

      // Avatar + name
      const topR = hbox(8, 'Member Top');
      topR.counterAxisAlignItems = 'CENTER';
      const avF = figma.createFrame();
      avF.resize(28, 28); avF.cornerRadius = 100;
      avF.fills = solid(m.avColor);
      avF.layoutMode = 'HORIZONTAL';
      avF.primaryAxisAlignItems = 'CENTER'; avF.counterAxisAlignItems = 'CENTER';
      avF.primaryAxisSizingMode = 'FIXED'; avF.counterAxisSizingMode = 'FIXED';
      avF.appendChild(txt(m.initials, 11, 'Bold', C.white));
      topR.appendChild(avF);
      const nameV = vbox(1, 'Name');
      nameV.appendChild(txt(m.name, 12, 'Bold', C.ink));
      nameV.appendChild(txt(m.role, 10, 'Regular', C.ink3));
      topR.appendChild(nameV);
      mc.appendChild(topR);

      // Stats
      const statsR = hbox(12, 'Stats');
      statsR.counterAxisAlignItems = 'CENTER';
      const addStat = (val, lbl, color) => {
        const sv = vbox(2, `Stat ${lbl}`);
        const vt = txt(String(val), 18, 'ExtraBold', color);
        vt.lineHeight = { value: 22, unit: 'PIXELS' };
        sv.appendChild(vt);
        sv.appendChild(txt(lbl, 9, 'Bold', C.ink3));
        statsR.appendChild(sv);
      };
      addStat(m.count, 'THIS MONTH', C.ink);
      addStat(m.combined, 'COMBINED', C.purple600);
      mc.appendChild(statsR);

      // Note
      const noteF = figma.createFrame();
      noteF.layoutMode = 'HORIZONTAL';
      noteF.primaryAxisSizingMode = 'FIXED';
      noteF.counterAxisSizingMode = 'AUTO';
      noteF.resize(memberStatW - 24, 10);
      noteF.paddingLeft = 6; noteF.paddingRight = 6;
      noteF.paddingTop = 4; noteF.paddingBottom = 4;
      noteF.fills = solid(C.thBg);
      noteF.cornerRadius = 4;
      noteF.strokes = S(C.border); noteF.strokeWeight = 1;
      noteF.strokes = [{ type: 'SOLID', color: C.border }];
      noteF.strokeAlign = 'INSIDE';
      noteF.appendChild(txt(m.note, 10, 'Regular', C.ink2, { width: memberStatW - 36 }));
      mc.appendChild(noteF);

      teamRow.appendChild(mc);
    }
    content.appendChild(teamRow);

    // ── SECTION DIVIDER ───────────────────────────────────────
    content.appendChild(divider(W - 48));

    // ── SECTION 3: SCENARIO TABLE ─────────────────────────────
    prog('Building scenario table…', 70);
    content.appendChild(sectionHeader(W - 48, 'All Team Scenarios', '47 scenarios · search and filter to find what you need', 'table'));

    // Filter bar
    const filterBar = figma.createFrame();
    filterBar.name = 'Filter Bar';
    filterBar.layoutMode = 'HORIZONTAL';
    filterBar.primaryAxisSizingMode = 'FIXED';
    filterBar.counterAxisSizingMode = 'AUTO';
    filterBar.resize(W - 48, 10);
    filterBar.paddingLeft = 0; filterBar.paddingRight = 0;
    filterBar.paddingTop = 8; filterBar.paddingBottom = 8;
    filterBar.itemSpacing = 8;
    filterBar.fills = noFill;
    filterBar.counterAxisAlignItems = 'CENTER';

    // Search input
    const searchF = figma.createFrame();
    searchF.name = 'Search Input';
    searchF.layoutMode = 'HORIZONTAL';
    searchF.primaryAxisSizingMode = 'FIXED';
    searchF.counterAxisSizingMode = 'FIXED';
    searchF.resize(340, 36);
    searchF.paddingLeft = 10; searchF.paddingRight = 10;
    searchF.paddingTop = 8; searchF.paddingBottom = 8;
    searchF.itemSpacing = 8;
    searchF.fills = solid(C.white);
    searchF.strokes = S(C.border); searchF.strokeWeight = 1; searchF.strokeAlign = 'INSIDE';
    searchF.cornerRadius = 4;
    searchF.counterAxisAlignItems = 'CENTER';
    searchF.appendChild(icon('search', 16, C.ink3));
    searchF.appendChild(txt('Search by name, ID, system, or tag…', 13, 'Regular', C.ink3));
    filterBar.appendChild(searchF);

    // Filter dropdowns
    const filterSelectors = ['Created By ▾', 'Claim Type ▾', 'Status ▾', 'RSH Pushed ▾'];
    for (const fs of filterSelectors) {
      const fd = figma.createFrame();
      fd.name = `Filter / ${fs}`;
      fd.layoutMode = 'HORIZONTAL';
      fd.primaryAxisSizingMode = 'AUTO';
      fd.counterAxisSizingMode = 'FIXED';
      fd.resize(10, 36);
      fd.paddingLeft = 10; fd.paddingRight = 10;
      fd.paddingTop = 6; fd.paddingBottom = 6;
      fd.itemSpacing = 6;
      fd.fills = solid(C.white);
      fd.strokes = S(C.border); fd.strokeWeight = 1; fd.strokeAlign = 'INSIDE';
      fd.cornerRadius = 4;
      fd.counterAxisAlignItems = 'CENTER';
      fd.appendChild(txt(fs, 13, 'SemiBold', C.ink));
      filterBar.appendChild(fd);
    }

    // Combined pill
    const combPill = figma.createFrame();
    combPill.name = 'Combined Toggle';
    combPill.layoutMode = 'HORIZONTAL';
    combPill.primaryAxisSizingMode = 'AUTO';
    combPill.counterAxisSizingMode = 'FIXED';
    combPill.resize(10, 36);
    combPill.paddingLeft = 10; combPill.paddingRight = 10;
    combPill.paddingTop = 6; combPill.paddingBottom = 6;
    combPill.itemSpacing = 5;
    combPill.fills = solid(C.purple50);
    combPill.strokes = S(C.purple200); combPill.strokeWeight = 1; combPill.strokeAlign = 'INSIDE';
    combPill.cornerRadius = 100;
    combPill.counterAxisAlignItems = 'CENTER';
    combPill.appendChild(icon('link', 14, C.purple600));
    combPill.appendChild(txt('Combined only', 13, 'SemiBold', C.purple600));
    filterBar.appendChild(combPill);

    content.appendChild(filterBar);

    // Table
    const tableF = figma.createFrame();
    tableF.name = 'Scenario Table';
    tableF.layoutMode = 'VERTICAL';
    tableF.primaryAxisSizingMode = 'AUTO';
    tableF.counterAxisSizingMode = 'FIXED';
    tableF.resize(W - 48, 100);
    tableF.fills = solid(C.white);
    tableF.strokes = S(C.tableBrd); tableF.strokeWeight = 1; tableF.strokeAlign = 'INSIDE';
    tableF.cornerRadius = 8;
    tableF.clipsContent = true;
    tableF.itemSpacing = 0;

    const headers = ['', 'Scenario Name', 'Status', 'Claim Type', 'System', 'Office · Region', 'RSH', 'Last Run', 'Tags', 'Actions'];
    tableF.appendChild(tableRow(W - 48, headers, true));

    const tableData = [
      {
        name: { type:'name', name:'TX-Austin ASC+Fac Combined 2026 v3', id:'SCN-40291', creator:'Skander B.', initials:'SB', avColor:{r:0.22,g:0.47,b:0.86}, latest:true, combined:true, note:'Rates updated, outliers removed' },
        status: { type:'status', value:'Provider Proposal' },
        claims: { type:'claims', values:['ASC','Facility'] },
        system: 'ASC Network',
        office: 'TX — Austin\nSouth Central',
        rsh:    { type:'rsh', value:true },
        date:   { type:'date', date:'May 14, 2026', time:'2:30 PM' },
        tags:   { type:'tags', values:['TX-Neg-4','Due May 19'] },
        action: { type:'action' },
      },
      {
        name: { type:'name', name:'TX-Austin ASC+Fac Combined 2026 v2', id:'SCN-40187', creator:'Skander B.', initials:'SB', avColor:{r:0.22,g:0.47,b:0.86}, latest:false, combined:true, note:'Base version before outlier removal' },
        status: { type:'status', value:'Cigna Proposal' },
        claims: { type:'claims', values:['ASC','Facility'] },
        system: 'ASC Network',
        office: 'TX — Austin\nSouth Central',
        rsh:    { type:'rsh', value:true },
        date:   { type:'date', date:'May 5, 2026', time:'10:32 AM' },
        tags:   { type:'tags', values:['TX-Neg-4'] },
        action: { type:'action' },
      },
      {
        name: { type:'name', name:'WA-Seattle Prof+Fac Combined v2', id:'SCN-38902', creator:'Priya N.', initials:'PN', avColor:{r:0,g:0.45,b:0.30}, latest:true, combined:true, note:'Finalized — all terms agreed' },
        status: { type:'status', value:'Final' },
        claims: { type:'claims', values:['Professional','Facility'] },
        system: 'Commercial PPO',
        office: 'WA — Seattle\nPacific NW',
        rsh:    { type:'rsh', value:true },
        date:   { type:'date', date:'May 14, 2026', time:'9:20 AM' },
        tags:   { type:'tags', values:['WA-Neg-2','Signed'] },
        action: { type:'action' },
      },
      {
        name: { type:'name', name:'GA-Atlanta Facility v4', id:'SCN-38144', creator:'Marcus C.', initials:'MC', avColor:{r:0.51,g:0.33,b:0.91}, latest:true, combined:false, note:'LOB split revised post-compliance' },
        status: { type:'status', value:'Cigna Proposal' },
        claims: { type:'claims', values:['Facility'] },
        system: 'Medicare Advantage',
        office: 'GA — Atlanta\nSoutheast',
        rsh:    { type:'rsh', value:false },
        date:   { type:'date', date:'May 13, 2026', time:'11:05 AM' },
        tags:   { type:'tags', values:['GA-Neg-3'] },
        action: { type:'action' },
      },
      {
        name: { type:'name', name:'NY-Albany Commercial Facility v2', id:'SCN-39714', creator:'Aisha T.', initials:'AT', avColor:{r:0,g:0.56,b:0.51}, latest:true, combined:false, note:'Awaiting updated network data' },
        status: { type:'status', value:'Test' },
        claims: { type:'claims', values:['Facility'] },
        system: 'Medicare Advantage',
        office: 'NY — Albany\nMid-Atlantic',
        rsh:    { type:'rsh', value:false },
        date:   { type:'date', date:'May 12, 2026', time:'4:45 PM' },
        tags:   { type:'tags', values:['Awaiting data'] },
        action: { type:'action' },
      },
    ];

    for (const row of tableData) {
      const cells = [
        '',
        row.name,
        row.status,
        row.claims,
        row.system,
        row.office,
        row.rsh,
        row.date,
        row.tags,
        row.action,
      ];
      tableF.appendChild(tableRow(W - 48, cells, false));
    }

    // Table footer
    const tfoot = figma.createFrame();
    tfoot.name = 'Table Footer';
    tfoot.layoutMode = 'HORIZONTAL';
    tfoot.primaryAxisSizingMode = 'FIXED';
    tfoot.counterAxisSizingMode = 'FIXED';
    tfoot.resize(W - 48, 40);
    tfoot.paddingLeft = 14; tfoot.paddingRight = 14;
    tfoot.fills = solid(C.thBg);
    tfoot.strokes = S(C.border); tfoot.strokeWeight = 1;
    tfoot.strokeAlign = 'INSIDE';
    tfoot.counterAxisAlignItems = 'CENTER';
    tfoot.primaryAxisAlignItems = 'SPACE_BETWEEN';
    tfoot.appendChild(txt('1–5 of 47 team scenarios  ·  312 org-wide', 12, 'SemiBold', C.ink2));

    const pageNav = hbox(4, 'Page Nav');
    pageNav.counterAxisAlignItems = 'CENTER';
    for (const p of ['chevron_left', '1', '2', '3', 'chevron_right']) {
      const pb = figma.createFrame();
      pb.layoutMode = 'HORIZONTAL'; pb.primaryAxisAlignItems = 'CENTER'; pb.counterAxisAlignItems = 'CENTER';
      pb.primaryAxisSizingMode = 'FIXED'; pb.counterAxisSizingMode = 'FIXED';
      pb.resize(28, 28); pb.cornerRadius = 4;
      if (p === '1') { pb.fills = solid(C.blue); pb.appendChild(txt('1', 12, 'Bold', C.white)); }
      else if (p === 'chevron_left' || p === 'chevron_right') { pb.fills = solid(C.white); pb.strokes = S(C.border); pb.strokeWeight = 1; pb.appendChild(icon(p, 16, C.ink2)); }
      else { pb.fills = solid(C.white); pb.strokes = S(C.border); pb.strokeWeight = 1; pb.appendChild(txt(p, 12, 'SemiBold', C.ink)); }
      pageNav.appendChild(pb);
    }
    tfoot.appendChild(pageNav);
    tableF.appendChild(tfoot);
    content.appendChild(tableF);

    main.appendChild(content);
    dashPage.appendChild(main);

    prog('Zooming to fit…', 95);
    figma.viewport.scrollAndZoomIntoView([main]);

    done('✓ Scenario Dashboard built on "Scenario Dashboard" page.\n47 scenarios · 5 renewal cards · team activity · full table.');

  } catch (e) {
    err(String(e));
  }
};
