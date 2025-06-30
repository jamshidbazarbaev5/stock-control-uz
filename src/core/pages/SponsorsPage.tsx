import { useTranslation } from 'react-i18next';
import { ResourceTable } from '../helpers/ResourseTable';
import { fetchSponsors, deleteSponsor, type Sponsor } from '../api/sponsors';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SponsorsPage() {
  const { t } = useTranslation();
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
 const navigate = useNavigate();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchSponsors();
      setSponsors(data);
    } catch (e) {
      toast.error('Failed to fetch sponsors');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = () => {
   navigate('/create-sponsor');
  };

  const handleEdit = (sponsor: Sponsor) => {
    navigate(`/sponsors/edit/${sponsor.id}`);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteSponsor(id);
      toast.success(t('messages.success.deleted', { item: t('navigation.sponsors') }));
      fetchData();
    } catch (e) {
      toast.error('Failed to delete sponsor');
    }
  };

 

  const columns = [
    { header: t('forms.name'), accessorKey: 'name' },
    { header: t('forms.phone'), accessorKey: 'phone_number' },
  ];


  return (
    <div className="container py-8 px-4">
      <ResourceTable<Sponsor>
        data={sponsors}
        columns={columns}
        isLoading={isLoading}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        
        totalCount={sponsors.length}
      />
     
    </div>
  );
}
