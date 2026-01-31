import { useState, useEffect } from 'react';
import ClientList from '../banking/ClientList'; 
import ClientDetail from '../banking/ClientDetail'; 

interface AdminBankingTabProps {
  users: any[];        
  transactions: any[]; 
  // UPDATED SIGNATURE
  onManageFunds: (userId: string, amount: number, type: 'deposit' | 'withdrawal' | 'bonus' | 'remove', transactionId?: number, method?: string) => Promise<void>;
  currentUserRole?: string;
}

export default function AdminBankingTab({ users, transactions, onManageFunds, currentUserRole }: AdminBankingTabProps) {
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  
  useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const clientId = params.get('client');
      if (clientId && users.length > 0) {
          const found = users.find(u => u.id === clientId);
          if (found) setSelectedUser(found);
      }
  }, [users]);

  const handleSelectUser = (user: any) => {
      setSelectedUser(user);
      const url = new URL(window.location.href);
      url.searchParams.set('client', user.id);
      window.history.pushState({}, '', url);
  };

  const handleBack = () => {
      setSelectedUser(null);
      const url = new URL(window.location.href);
      url.searchParams.delete('client');
      window.history.pushState({}, '', url);
  };

  if (selectedUser) {
      return (
          <ClientDetail 
              user={selectedUser}
              transactions={transactions}
              onBack={handleBack}
              onManageFunds={onManageFunds}
              currentUserRole={currentUserRole}
          />
      );
  }

  return (
    <div className="h-full p-4 overflow-hidden flex flex-col">
       <ClientList 
          users={users} 
          transactions={transactions} 
          onSelectUser={handleSelectUser} 
       />
    </div>
  );
}