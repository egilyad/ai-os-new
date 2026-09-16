import React from 'react';
import FleetPanel from '../FleetPanel/FleetPanel';
// 6.6 — dedicated wrapper: Fleet split into 6 panels (reuse FleetPanel with initial tab)
const CrewsPanel: React.FC = () => <FleetPanel initialTab="crews" />;
export default CrewsPanel;
