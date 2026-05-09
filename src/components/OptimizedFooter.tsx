// Legacy Croft Common footer — permanently retired.
// Re-exports the Crazy Bear footer so any caller still importing
// OptimizedFooter renders the new B&W Bears Den footer.
import CBFooter from './crazybear/CBFooter';

const OptimizedFooter = () => <CBFooter />;

export default OptimizedFooter;
