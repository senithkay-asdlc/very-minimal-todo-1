// The app chrome — every gated screen renders inside it, per the Oxygen sample
// app's AppLayout (references/app-structure.md). The wireframe draws only a
// brand-only navbar ("Todo") on each screen; the sidebar is the one navigable
// rail item this small app has — My Todos, the landing screen every flow
// returns to. New Todo and Todo Detail are reached contextually (a button, a
// row click), never from the rail, so they carry no Sidebar.Item of their own.
import {
  AppShell as OxygenAppShell,
  Header,
  Sidebar,
  Footer,
  UserMenu,
  ColorSchemeToggle,
  Divider,
} from "@wso2/oxygen-ui";
import { ListChecks, LogOut } from "@wso2/oxygen-ui-icons-react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { APP_NAME } from "../appName";
import { useAuthz } from "../authz/gates";
import { signOut } from "../authz/session";

export function AppShell() {
  const { pathname } = useLocation();
  const { username } = useAuthz();
  const active = pathname.startsWith("/todos") ? "mytodos" : "";

  return (
    <OxygenAppShell>
      <OxygenAppShell.Navbar>
        <Header>
          <Header.Toggle />
          <Header.Brand>
            <Header.BrandTitle>{APP_NAME}</Header.BrandTitle>
          </Header.Brand>
          <Header.Spacer />
          <Header.Actions>
            <ColorSchemeToggle />
            <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />
            <UserMenu>
              <UserMenu.Trigger name={username || "Signed in"} />
              <UserMenu.Header name={username || "Signed in"} email={username} />
              <UserMenu.Logout icon={<LogOut />} onClick={() => void signOut()} />
            </UserMenu>
          </Header.Actions>
        </Header>
      </OxygenAppShell.Navbar>

      <OxygenAppShell.Sidebar>
        <Sidebar activeItem={active}>
          <Sidebar.Nav>
            <Sidebar.Category>
              <Sidebar.Item id="mytodos" link={<Link to="/todos" />}>
                <Sidebar.ItemIcon>
                  <ListChecks />
                </Sidebar.ItemIcon>
                <Sidebar.ItemLabel>My Todos</Sidebar.ItemLabel>
              </Sidebar.Item>
            </Sidebar.Category>
          </Sidebar.Nav>
        </Sidebar>
      </OxygenAppShell.Sidebar>

      <OxygenAppShell.Main>
        <Outlet />
      </OxygenAppShell.Main>

      <OxygenAppShell.Footer>
        <Footer>
          <Footer.Copyright>© WSO2 LLC</Footer.Copyright>
        </Footer>
      </OxygenAppShell.Footer>
    </OxygenAppShell>
  );
}
