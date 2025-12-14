# KGC RBAC Hierarchia (6 Szerepkör) - Dokumentáció

## Diagram Alapinformációk

| Tulajdonság | Érték |
|-------------|-------|
| **Fájlnév** | rbac-hierarchia.excalidraw |
| **Típus** | Hierarchia diagram + Jogosultsági mátrix |
| **Verzió** | 1.0 |
| **Létrehozva** | 2025-12-03 |
| **Forrás** | ADR-001-franchise-multitenancy.md |

---

## Áttekintés

A KGC ERP v2 rendszer **6 szerepkörös RBAC** (Role-Based Access Control) modellt használ, amely két fő tenant típust különböztet meg:

- **KÖZPONT** (`tenant_type: 'central'`) - Kisgépcentrum központi üzemeltetők
- **FRANCHISE** (`tenant_type: 'franchise'`) - Franchise partnerek

A hierarchia biztosítja, hogy minden felhasználó csak a saját tenant adataihoz férhessen hozzá, miközben a központ aggregált statisztikákat láthat.

---

## Tenant Típusok

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   ┌──────────────────────────────────┐    ┌─────────────────────────────┐  │
│   │      KÖZPONT                      │    │       FRANCHISE              │  │
│   │  (tenant_type: 'central')         │    │  (tenant_type: 'franchise')  │  │
│   │                                   │    │                              │  │
│   │  • Kisgépcentrum Érd              │    │  • Győr franchise            │  │
│   │  • Rendszer tulajdonos            │    │  • Debrecen franchise        │  │
│   │  • Országos átlátás               │    │  • Szeged franchise          │  │
│   │                                   │    │  • ...                       │  │
│   └──────────────────────────────────┘    └─────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Szerepkör Hierarchia

### Központi Szerepkörök (3 db)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     KÖZPONT (tenant_type: 'central')                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                          ┌────────────────────────┐                         │
│                          │     SUPER_ADMIN        │                         │
│                          │     (Piros keret)      │                         │
│                          │                        │                         │
│                          │  MINDEN jogosultság    │                         │
│                          │  • Teljes rendszer     │                         │
│                          │  • Minden tenant       │                         │
│                          │  • Adatexport          │                         │
│                          └───────────┬────────────┘                         │
│                                      │                                      │
│                       ┌──────────────┴──────────────┐                       │
│                       │                             │                       │
│                       ▼                             ▼                       │
│           ┌───────────────────┐        ┌───────────────────────┐           │
│           │  CENTRAL_ADMIN    │        │  CENTRAL_OPERATOR     │           │
│           │                   │        │                       │           │
│           │  Franchise kezelés│        │  Központi bolt        │           │
│           │  • Partner CRUD   │        │  • Bérlés/értékesítés │           │
│           │  • Országos stat. │        │  • Szerviz            │           │
│           │  • ❌ Pénzügyek   │        │  • Alap riportok      │           │
│           └───────────────────┘        └───────────────────────┘           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Franchise Szerepkörök (3 db)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FRANCHISE (tenant_type: 'franchise')                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                          ┌────────────────────────┐                         │
│                          │   FRANCHISE_ADMIN      │                         │
│                          │    (Zöld keret)        │                         │
│                          │                        │                         │
│                          │  Saját franchise       │                         │
│                          │  • Felhasználók        │                         │
│                          │  • Teljes pénzügy      │                         │
│                          │  • ❌ Más franchise    │                         │
│                          └───────────┬────────────┘                         │
│                                      │                                      │
│                       ┌──────────────┴──────────────┐                       │
│                       │                             │                       │
│                       ▼                             ▼                       │
│           ┌───────────────────┐        ┌───────────────────────┐           │
│           │  STORE_MANAGER    │        │     OPERATOR          │           │
│           │                   │        │                       │           │
│           │  Napi műveletek   │        │  Tranzakciók          │           │
│           │  • Bérlés/elad    │        │  • Bérlés/eladás      │           │
│           │  • Lokális riport │        │  • Ügyfél keresés     │           │
│           │  • ❌ Pénzügyek   │        │  • ❌ Riportok        │           │
│           └───────────────────┘        └───────────────────────┘           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Szerepkörök Részletezése

### 1. SUPER_ADMIN

| Tulajdonság | Érték |
|-------------|-------|
| **Tenant scope** | Global (minden tenant) |
| **Szín kód** | Piros |
| **Tipikus felhasználó** | Rendszer tulajdonos, CTO |

**Jogosultságok:**
- Teljes rendszer hozzáférés
- Minden tenant kezelése (létrehozás, törlés, módosítás)
- Összes pénzügyi adat megtekintése
- Adatexport engedélyezve
- Felhasználók kezelése minden tenant-ben
- Rendszer konfiguráció

### 2. CENTRAL_ADMIN

| Tulajdonság | Érték |
|-------------|-------|
| **Tenant scope** | Central tenant + aggregált adatok |
| **Szín kód** | Kék |
| **Tipikus felhasználó** | Franchise menedzser, üzletfejlesztő |

**Jogosultságok:**
- Franchise partnerek létrehozása és kezelése
- Országos aggregált statisztikák
- Tenant felhasználók kezelése
- **NEM LÁTJA:** Egyedi franchise pénzügyi adatokat

### 3. CENTRAL_OPERATOR

| Tulajdonság | Érték |
|-------------|-------|
| **Tenant scope** | Csak central tenant |
| **Szín kód** | Kék |
| **Tipikus felhasználó** | Központi bolt eladó, szervizes |

**Jogosultságok:**
- Bérlés, értékesítés, szerviz műveletek
- Saját tenant ügyfélkezelés
- Alap riportok (saját tenant)
- **NEM LÁTJA:** Más tenant adatokat

### 4. FRANCHISE_ADMIN

| Tulajdonság | Érték |
|-------------|-------|
| **Tenant scope** | Saját franchise tenant |
| **Szín kód** | Zöld |
| **Tipikus felhasználó** | Franchise tulajdonos |

**Jogosultságok:**
- Saját franchise teljes kezelése
- Felhasználók létrehozása (STORE_MANAGER, OPERATOR)
- Teljes pénzügyi adatok (saját tenant)
- Saját statisztikák
- **NEM LÁTJA:** Más franchise adatokat, központi pénzügyeket

### 5. STORE_MANAGER

| Tulajdonság | Érték |
|-------------|-------|
| **Tenant scope** | Saját franchise tenant (korlátozott) |
| **Szín kód** | Zöld |
| **Tipikus felhasználó** | Üzletvezető, műszakvezető |

**Jogosultságok:**
- Napi műveletek (bérlés, eladás, szerviz)
- Lokális statisztikák
- Ügyfélkezelés
- **NEM LÁTJA:** Pénzügyi összesítőket, felhasználó kezelés

### 6. OPERATOR

| Tulajdonság | Érték |
|-------------|-------|
| **Tenant scope** | Saját franchise tenant (minimális) |
| **Szín kód** | Zöld |
| **Tipikus felhasználó** | Pultban dolgozó eladó |

**Jogosultságok:**
- Tranzakciók kezelése (bérlés, eladás)
- Ügyfél keresés (nem létrehozás)
- **NEM LÁTJA:** Riportok, statisztikák, pénzügyek

---

## Jogosultsági Mátrix

```
┌────────────────────────┬──────────────┬──────────────┬────────────────┬────────────────┬──────────────┬──────────┐
│ Funkció                │ SUPER_ADMIN  │ CENTRAL_ADM  │ CENTRAL_OP     │ FRANCHISE_ADM  │ STORE_MGR    │ OPERATOR │
├────────────────────────┼──────────────┼──────────────┼────────────────┼────────────────┼──────────────┼──────────┤
│ Tenant létrehozás      │      ✅      │      ✅      │       ❌       │       ❌       │      ❌      │    ❌    │
│ Felhasználó kezelés    │      ✅      │      ✅      │       ❌       │       ✅       │      ❌      │    ❌    │
│ Országos statisztika   │      ✅      │      ✅      │       ❌       │       ❌       │      ❌      │    ❌    │
│ Saját pénzügy (teljes) │      ✅      │      ❌      │       ✅       │       ✅       │      ❌      │    ❌    │
│ Lokális statisztika    │      ✅      │      ✅      │       ✅       │       ✅       │      ✅      │    ❌    │
│ Bérlés/Értékesítés     │      ✅      │      ❌      │       ✅       │       ✅       │      ✅      │    ✅    │
│ Szerviz modul          │      ✅      │      ❌      │       ✅       │    csomag!     │   csomag!    │ csomag!  │
│ Országos készlet (R)   │      ✅      │      ✅      │       ✅       │       ✅       │      ✅      │    ✅    │
│ Adatexport             │      ✅      │      ❌      │       ❌       │       ❌       │      ❌      │    ❌    │
│ Más tenant adatai      │      ✅      │      ❌       │       ❌       │       ❌       │      ❌      │    ❌    │
└────────────────────────┴──────────────┴──────────────┴────────────────┴────────────────┴──────────────┴──────────┘
```

### Megjegyzések

- **csomag!** = A franchise csomag (Kölcsönző/Szerviz/Komplett) határozza meg, hogy elérhető-e
- Minden jogosultság a **SAJÁT TENANT**-en belül érvényes, kivéve SUPER_ADMIN

---

## Franchise Csomagok és Modulok

A franchise partnerek 3 csomag közül választhatnak, ami befolyásolja az elérhető funkciókat:

| Modul | Kölcsönző | Szerviz | Komplett |
|-------|-----------|---------|----------|
| Bérlés | ✅ | ❌ | ✅ |
| Értékesítés | ✅ | ❌ | ✅ |
| Szerviz | ❌ | ✅ | ✅ |
| Országos készlet | ✅ | ❌ | ✅ |

### Szerepkör + Csomag Kombináció

```typescript
// Jogosultság ellenőrzés példa
function canAccessModule(
  user: User,
  module: 'rental' | 'service' | 'sales'
): boolean {
  // SUPER_ADMIN mindent lát
  if (user.role === 'SUPER_ADMIN') return true;

  // Central tenant minden modult használhat
  if (user.tenant.type === 'central') {
    return hasRolePermission(user.role, module);
  }

  // Franchise: szerepkör + csomag ellenőrzés
  const packageModules = getPackageModules(user.tenant.package);
  const hasPackageAccess = packageModules.includes(module);
  const hasRoleAccess = hasRolePermission(user.role, module);

  return hasPackageAccess && hasRoleAccess;
}
```

---

## Adatbázis Implementáció

### Szerepkörök Tábla

```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  tenant_scope ENUM('global', 'tenant') NOT NULL,
  permissions JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Seed data
INSERT INTO roles (name, tenant_scope, permissions) VALUES
('SUPER_ADMIN', 'global', '{"all": true}'),
('CENTRAL_ADMIN', 'tenant', '{
  "tenant:create": true,
  "tenant:read": true,
  "user:manage": true,
  "stats:national": true,
  "stats:local": true,
  "finance:own": false
}'),
('CENTRAL_OPERATOR', 'tenant', '{
  "rental:*": true,
  "sales:*": true,
  "service:*": true,
  "customer:*": true,
  "stats:local": true,
  "finance:own": true
}'),
('FRANCHISE_ADMIN', 'tenant', '{
  "user:manage": true,
  "rental:*": true,
  "sales:*": true,
  "service:*": true,
  "customer:*": true,
  "stats:local": true,
  "finance:own": true
}'),
('STORE_MANAGER', 'tenant', '{
  "rental:*": true,
  "sales:*": true,
  "service:*": true,
  "customer:*": true,
  "stats:local": true
}'),
('OPERATOR', 'tenant', '{
  "rental:create": true,
  "rental:read": true,
  "sales:create": true,
  "sales:read": true,
  "customer:read": true
}');
```

### Felhasználó-Szerepkör Kapcsolat

```sql
CREATE TABLE user_roles (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE RESTRICT,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT NOW(),
  assigned_by UUID REFERENCES users(id),
  PRIMARY KEY (user_id, role_id, tenant_id)
);

-- Index a gyakori lekérdezésekhez
CREATE INDEX idx_user_roles_tenant ON user_roles(tenant_id);
CREATE INDEX idx_user_roles_user ON user_roles(user_id);
```

---

## Row Level Security (RLS)

```sql
-- RLS engedélyezése
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Tenant izoláció policy
CREATE POLICY tenant_isolation ON customers
  FOR ALL
  USING (
    tenant_id = current_setting('app.current_tenant_id')::uuid
    OR
    current_setting('app.user_role') = 'SUPER_ADMIN'
  );

-- Példa: Országos készlet olvasás (mindenki láthatja)
CREATE POLICY national_inventory_read ON products
  FOR SELECT
  USING (true);  -- Olvasás mindenkinek

-- Példa: Írás csak saját tenant
CREATE POLICY products_write ON products
  FOR INSERT
  USING (
    tenant_id = current_setting('app.current_tenant_id')::uuid
  );
```

---

## Offline PWA Működés

```
┌──────────────────────────────────────────────────────────────────┐
│                   📱 OFFLINE PWA MÓDBAN                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Minden szerepkör működik offline módban is!                    │
│                                                                  │
│  ✅ Jogosultságok lokálisan érvényesülnek                       │
│  ✅ IndexedDB-ben tárolt role információ                        │
│  ⏳ Szinkronizáció online visszatéréskor                        │
│                                                                  │
│  Korlátozások:                                                   │
│  • Országos készlet: utolsó szinkron állapot                    │
│  • Felhasználó kezelés: csak online                             │
│  • Tenant létrehozás: csak online                               │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Offline Jogosultság Ellenőrzés

```typescript
// Kliens oldali jogosultság ellenőrzés (offline-képes)
class OfflineAuthService {
  private userRole: Role;
  private tenantPackage: FranchisePackage;

  async initialize() {
    const cached = await db.userSession.get('current');
    this.userRole = cached.role;
    this.tenantPackage = cached.tenant.package;
  }

  canAccess(permission: string): boolean {
    // Lokálisan ellenőriz, szerver validálja szinkronkor
    return this.userRole.permissions[permission] === true;
  }

  canAccessModule(module: ModuleType): boolean {
    const moduleEnabled = this.tenantPackage.modules.includes(module);
    const hasPermission = this.canAccess(`${module}:*`);
    return moduleEnabled && hasPermission;
  }
}
```

---

## Összefoglaló Táblázat

| Szerepkör | Tenant típus | Scope | Fő feladat |
|-----------|--------------|-------|------------|
| SUPER_ADMIN | Central | Global | Teljes rendszer |
| CENTRAL_ADMIN | Central | National | Franchise hálózat |
| CENTRAL_OPERATOR | Central | Local | Központi bolt |
| FRANCHISE_ADMIN | Franchise | Local | Saját franchise |
| STORE_MANAGER | Franchise | Local | Napi műveletek |
| OPERATOR | Franchise | Local | Tranzakciók |

---

## Kapcsolódó Dokumentumok

- [ADR-001: Franchise Multi-Tenant Architektúra](../architecture/ADR-001-franchise-multitenancy.md)
- [ADR-003: White Label Strategy](../architecture/ADR-003-white-label-strategy.md)
- [Franchise Adatfolyam](franchise-adatfolyam.md)
- [PRD v1.1](../prd.md) - 3. Jogosultsági rendszer

---

## Változásnapló

| Dátum | Verzió | Változás |
|-------|--------|----------|
| 2025-12-03 | 1.0 | Dokumentáció létrehozása |
