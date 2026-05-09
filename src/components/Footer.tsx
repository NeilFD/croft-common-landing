// Legacy Croft Common footer — permanently retired.
// Every consumer in the app re-uses the Crazy Bear footer (CBFooter) so
// the old Croft Common markup can never render again, no matter which
// component is imported.
import CBFooter from './crazybear/CBFooter';

const Footer = (_props: { showSubscription?: boolean } = {}) => {
  return <CBFooter />;
};

export default Footer;
